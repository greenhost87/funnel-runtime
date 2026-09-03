CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS funnel_versions (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS funnel_activation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id TEXT NOT NULL REFERENCES funnel_versions(id),
  activated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activation_history_activated_at
  ON funnel_activation_history(activated_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES funnel_versions(id),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  answers_json TEXT NOT NULL DEFAULT '{}',
  current_step_id TEXT,
  is_result INTEGER NOT NULL DEFAULT 0,
  history_json TEXT NOT NULL DEFAULT '[]',
  session_started_event_id TEXT NOT NULL,
  session_started_recorded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_version ON sessions(version_id);
CREATE INDEX IF NOT EXISTS idx_sessions_variant ON sessions(variant);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_campaign ON sessions(utm_campaign);

CREATE TABLE IF NOT EXISTS session_transitions (
  transition_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  version_id TEXT NOT NULL REFERENCES funnel_versions(id),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  from_step_id TEXT NOT NULL,
  to_step_id TEXT,
  to_result INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transitions_session ON session_transitions(session_id);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  event_name TEXT NOT NULL,
  server_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  client_timestamp TEXT NOT NULL,
  version_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  step_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  transition_id TEXT REFERENCES session_transitions(transition_id),
  properties_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_version ON events(version_id);
CREATE INDEX IF NOT EXISTS idx_events_variant ON events(variant);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_events_transition ON events(transition_id);
