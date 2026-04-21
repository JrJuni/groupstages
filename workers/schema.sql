-- Cloudflare D1 (SQLite) 스키마
-- PostgreSQL에서 마이그레이션

-- 경기 결과 테이블
CREATE TABLE IF NOT EXISTS match_results (
  id         TEXT PRIMARY KEY,
  group_key  TEXT NOT NULL,
  home_id    TEXT NOT NULL,
  away_id    TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchday   INTEGER,
  match_date TEXT,                          -- ISO 8601 format
  venue      TEXT,
  city       TEXT,
  status     TEXT DEFAULT 'NS',             -- NS/FT/1H/HT/2H
  fixture_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_match_group ON match_results(group_key);
CREATE INDEX IF NOT EXISTS idx_fixture_id ON match_results(fixture_id);

-- API 팀 ID 매핑 (42/42팀)
CREATE TABLE IF NOT EXISTS team_mapping (
  our_team_id   TEXT PRIMARY KEY,
  api_team_id   INTEGER NOT NULL UNIQUE,
  api_team_name TEXT,
  api_team_code TEXT
);

-- 카드 통계 (Fair Play)
CREATE TABLE IF NOT EXISTS team_statistics (
  team_id         TEXT NOT NULL,
  group_key       TEXT NOT NULL,
  yellow_cards    INTEGER DEFAULT 0,
  two_yellow_red  INTEGER DEFAULT 0,
  direct_red      INTEGER DEFAULT 0,
  fair_play_points INTEGER DEFAULT 0,
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (team_id, group_key)
);

-- 경기별 카드 캐시 (실시간 수집 → team_statistics 합산)
CREATE TABLE IF NOT EXISTS fixture_cards (
  fixture_id    INTEGER PRIMARY KEY,
  home_id       TEXT NOT NULL,
  away_id       TEXT NOT NULL,
  cards_json    TEXT NOT NULL DEFAULT '{}',
  is_final      INTEGER DEFAULT 0,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- API 동기화 로그
CREATE TABLE IF NOT EXISTS api_sync_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type        TEXT NOT NULL,
  status           TEXT NOT NULL,
  fixtures_synced  INTEGER DEFAULT 0,
  teams_synced     INTEGER DEFAULT 0,
  error_message    TEXT,
  sync_duration_ms INTEGER,
  synced_at        TEXT DEFAULT (datetime('now'))
);

-- ELO 캐시 (eloratings.net 기반, 일 4회 cron 갱신)
CREATE TABLE IF NOT EXISTS team_elo (
  team_id    TEXT PRIMARY KEY,
  elo        INTEGER NOT NULL,
  elo_code   TEXT,                          -- eloratings.net 코드 (ES/AR/...)
  elo_rank   INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 폼 캐시 (API-Football last=10 집계, 일 4회 cron 갱신)
CREATE TABLE IF NOT EXISTS team_form (
  team_id      TEXT PRIMARY KEY,
  matches_n    INTEGER NOT NULL,            -- 집계 경기 수 (sparse 시 < last_n)
  gf_per_game  REAL NOT NULL,
  ga_per_game  REAL NOT NULL,
  last_n       INTEGER NOT NULL,            -- 요청한 윈도우 (보통 10)
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- 문의 폼 메시지 (Phase 2)
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  lang        TEXT,
  ip_hash     TEXT,                         -- SHA-256(IP + daily-salt), 식별 불가
  user_agent  TEXT,
  status      TEXT DEFAULT 'new',           -- new/read/replied
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at);

-- IP 기반 rate limit (10분 창, IP당 5건 상한)
CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip_hash     TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  window_start TEXT DEFAULT (datetime('now'))
);
