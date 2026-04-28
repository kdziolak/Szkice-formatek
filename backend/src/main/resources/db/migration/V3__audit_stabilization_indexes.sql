create index if not exists idx_draft_object_states_object
  on draft_object_states(object_id);

create index if not exists idx_change_history_object_changed_at
  on change_history(object_id, changed_at desc);

create index if not exists idx_validation_issues_object_resolved
  on validation_issues(object_id, resolved);

create index if not exists idx_draft_road_section_states_section
  on draft_road_section_states(road_section_id);

create index if not exists idx_validation_issues_target_resolved
  on validation_issues(target_type, target_id, resolved);
