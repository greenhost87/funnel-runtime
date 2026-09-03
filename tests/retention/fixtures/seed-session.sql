INSERT INTO funnel_versions (id, config_id, config_json) VALUES (?, ?, ?);
INSERT INTO sessions (id, version_id, variant, session_started_event_id, created_at, updated_at) VALUES (?, ?, 'A', ?, ?, ?);
INSERT INTO session_transitions (transition_id, session_id, version_id, variant, from_step_id, created_at) VALUES (?, ?, ?, 'A', 'step-1', ?);
INSERT INTO events (event_id, session_id, event_name, client_timestamp, version_id, variant, transition_id) VALUES (?, ?, 'step_completed', ?, ?, 'A', ?);
