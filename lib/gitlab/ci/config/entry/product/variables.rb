# frozen_string_literal: true

module Gitlab
  module Ci
    class Config
      module Entry
        ##
        # Entry that represents variables for parallel matrix builds.
        #
        module Product
          class Variables < ::Gitlab::Config::Entry::Node
            include ::Gitlab::Config::Entry::Validatable

            validations do
              validates :config, variables: { array_values: true }
              validates :config, length: {
                minimum: 2,
                too_short: 'requires at least %{count} items'
              }
            end

            def self.default(**)
              {}
            end

            def value
              @config
                .map { |key, value| [key.to_s, Array(value).map(&:to_s)] }
                .to_h
            end
          end
        end
      end
    end
  end
end
