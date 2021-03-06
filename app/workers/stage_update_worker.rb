# frozen_string_literal: true

class StageUpdateWorker
  include ApplicationWorker
  include PipelineQueue

  queue_namespace :pipeline_processing
  urgency :high

  idempotent!

  def perform(stage_id)
    Ci::Stage.find_by_id(stage_id)&.update_legacy_status
  end
end
