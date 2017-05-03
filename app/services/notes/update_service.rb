module Notes
  class UpdateService < BaseService
    def execute(note)
      return note unless note.editable?

      old_mentioned_users = note.mentioned_users.to_a

      note.assign_attributes(params)
      params.merge!(last_edited_at: Time.now, last_edited_by: current_user) if note.note_changed?

      note.update_attributes(params.merge(updated_by: current_user))

      note.create_new_cross_references!(current_user)

      if note.previous_changes.include?('note')
        TodoService.new.update_note(note, current_user, old_mentioned_users)
      end

      note
    end
  end
end
