# frozen_string_literal: true

require 'spec_helper'

RSpec.describe GitlabSchema.types['MergeRequest'] do
  specify { expect(described_class).to expose_permissions_using(Types::PermissionTypes::MergeRequest) }

  specify { expect(described_class).to require_graphql_authorizations(:read_merge_request) }

  specify { expect(described_class.interfaces).to include(Types::Notes::NoteableType) }

  specify { expect(described_class.interfaces).to include(Types::CurrentUserTodos) }

  it 'has the expected fields' do
    expected_fields = %w[
      notes discussions user_permissions id iid title title_html description
      description_html state created_at updated_at source_project target_project
      project project_id source_project_id target_project_id source_branch
      target_branch work_in_progress merge_when_pipeline_succeeds diff_head_sha
      merge_commit_sha user_notes_count should_remove_source_branch
      diff_refs diff_stats diff_stats_summary
      force_remove_source_branch merge_status in_progress_merge_commit_sha
      merge_error allow_collaboration should_be_rebased rebase_commit_sha
      rebase_in_progress merge_commit_message default_merge_commit_message
      merge_ongoing mergeable_discussions_state web_url
      source_branch_exists target_branch_exists
      upvotes downvotes head_pipeline pipelines task_completion_status
      milestone assignees participants subscribed labels discussion_locked time_estimate
      total_time_spent reference author merged_at commit_count current_user_todos
    ]

    if Gitlab.ee?
      expected_fields << 'approved'
      expected_fields << 'approved_by'
    end

    expect(described_class).to have_graphql_fields(*expected_fields)
  end
end
