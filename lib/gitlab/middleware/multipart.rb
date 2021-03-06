# frozen_string_literal: true

# Gitlab::Middleware::Multipart - a Rack::Multipart replacement
#
# Rack::Multipart leaves behind tempfiles in /tmp and uses valuable Ruby
# process time to copy files around. This alternative solution uses
# gitlab-workhorse to clean up the tempfiles and puts the tempfiles in a
# location where copying should not be needed.
#
# When gitlab-workhorse finds files in a multipart MIME body it sends
# a signed message via a request header. This message lists the names of
# the multipart entries that gitlab-workhorse filtered out of the
# multipart structure and saved to tempfiles. Workhorse adds new entries
# in the multipart structure with paths to the tempfiles.
#
# The job of this Rack middleware is to detect and decode the message
# from workhorse. If present, it walks the Rack 'params' hash for the
# current request, opens the respective tempfiles, and inserts the open
# Ruby File objects in the params hash where Rack::Multipart would have
# put them. The goal is that application code deeper down can keep
# working the way it did with Rack::Multipart without changes.
#
# CAVEAT: the code that modifies the params hash is a bit complex. It is
# conceivable that certain Rack params structures will not be modified
# correctly. We are not aware of such bugs at this time though.
#

module Gitlab
  module Middleware
    class Multipart
      RACK_ENV_KEY = 'HTTP_GITLAB_WORKHORSE_MULTIPART_FIELDS'

      class Handler
        def initialize(env, message)
          @request = Rack::Request.new(env)
          @rewritten_fields = message['rewritten_fields']
          @open_files = []
        end

        def with_open_files
          @rewritten_fields.each do |field, tmp_path|
            parsed_field = Rack::Utils.parse_nested_query(field)
            raise "unexpected field: #{field.inspect}" unless parsed_field.count == 1

            key, value = parsed_field.first
            if value.nil? # we have a top level param, eg. field = 'foo' and not 'foo[bar]'
              raise "invalid field: #{field.inspect}" if field != key

              value = open_file(@request.params, key, tmp_path.presence)
              @open_files << value
            else
              value = decorate_params_value(value, @request.params[key], tmp_path.presence)
            end

            update_param(key, value)
          end

          yield
        ensure
          @open_files.compact
                     .each(&:close)
        end

        # This function calls itself recursively
        def decorate_params_value(path_hash, value_hash, path_override = nil)
          unless path_hash.is_a?(Hash) && path_hash.count == 1
            raise "invalid path: #{path_hash.inspect}"
          end

          path_key, path_value = path_hash.first

          unless value_hash.is_a?(Hash) && value_hash[path_key]
            raise "invalid value hash: #{value_hash.inspect}"
          end

          case path_value
          when nil
            value_hash[path_key] = open_file(value_hash.dig(path_key), '', path_override)
            @open_files << value_hash[path_key]
            value_hash
          when Hash
            decorate_params_value(path_value, value_hash[path_key], path_override)
            value_hash
          else
            raise "unexpected path value: #{path_value.inspect}"
          end
        end

        def open_file(params, key, path_override = nil)
          ::UploadedFile.from_params(params, key, allowed_paths, path_override)
        end

        # update_params ensures that both rails controllers and rack middleware can find
        # workhorse accelerate files in the request
        def update_param(key, value)
          # we make sure we have key in POST otherwise update_params will add it in GET
          @request.POST[key] ||= value

          # this will force Rack::Request to properly update env keys
          @request.update_param(key, value)

          # ActionDispatch::Request is based on Rack::Request but it caches params
          # inside other env keys, here we ensure everything is updated correctly
          ActionDispatch::Request.new(@request.env).update_param(key, value)
        end

        private

        def package_allowed_paths
          packages_config = ::Gitlab.config.packages
          return [] unless allow_packages_storage_path?(packages_config)

          [::Packages::PackageFileUploader.workhorse_upload_path]
        end

        def allow_packages_storage_path?(packages_config)
          return false unless packages_config.enabled
          return false unless packages_config['storage_path']
          return false if packages_config.object_store.enabled && packages_config.object_store.direct_upload

          true
        end

        def allowed_paths
          [
            Dir.tmpdir,
            ::FileUploader.root,
            ::Gitlab.config.uploads.storage_path,
            ::JobArtifactUploader.workhorse_upload_path,
            ::LfsObjectUploader.workhorse_upload_path,
            File.join(Rails.root, 'public/uploads/tmp')
          ] + package_allowed_paths
        end
      end

      def initialize(app)
        @app = app
      end

      def call(env)
        encoded_message = env.delete(RACK_ENV_KEY)
        return @app.call(env) if encoded_message.blank?

        message = ::Gitlab::Workhorse.decode_jwt(encoded_message)[0]

        ::Gitlab::Middleware::Multipart::Handler.new(env, message).with_open_files do
          @app.call(env)
        end
      rescue UploadedFile::InvalidPathError => e
        [400, { 'Content-Type' => 'text/plain' }, e.message]
      end
    end
  end
end
