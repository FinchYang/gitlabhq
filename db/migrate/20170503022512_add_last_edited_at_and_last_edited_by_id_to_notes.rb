# See http://doc.gitlab.com/ce/development/migration_style_guide.html
# for more information on how to write migrations for GitLab.

class AddLastEditedAtAndLastEditedByIdToNotes < ActiveRecord::Migration
  include Gitlab::Database::MigrationHelpers

  # Set this constant to true if this migration requires downtime.
  DOWNTIME = false

  def change
    add_column :notes, :last_edited_at, :timestamp
    add_column :notes, :last_edited_by_id, :integer
  end
end
