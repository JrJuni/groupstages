-- ================================================================
-- GroupStages 2026 World Cup - 완전한 DB 스키마
-- ================================================================

-- 1. match_results 테이블 (경기 결과)
CREATE TABLE IF NOT EXISTS match_results (
  id VARCHAR(100) PRIMARY KEY,
  group_key CHAR(1) NOT NULL,
  home_id VARCHAR(30) NOT NULL,
  away_id VARCHAR(30) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchday SMALLINT,
  match_date TIMESTAMPTZ,
  status VARCHAR(10) DEFAULT 'NS',
  fixture_id INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_results_group ON match_results (group_key);
CREATE INDEX IF NOT EXISTS idx_match_results_match_date ON match_results (match_date);
CREATE INDEX IF NOT EXISTS idx_match_results_fixture_id ON match_results (fixture_id);

COMMENT ON TABLE match_results IS '2026 World Cup 조별리그 경기 결과';

-- 2. 팀 ID 매핑 테이블
CREATE TABLE IF NOT EXISTS team_mapping (
  our_team_id VARCHAR(30) PRIMARY KEY,
  api_team_id INTEGER NOT NULL UNIQUE,
  api_team_name VARCHAR(100),
  api_team_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_mapping_api_id ON team_mapping (api_team_id);

COMMENT ON TABLE team_mapping IS '우리 팀 ID와 API-Football 팀 ID 매핑';

-- 3. 팀별 카드 통계 테이블
CREATE TABLE IF NOT EXISTS team_statistics (
  team_id VARCHAR(30) NOT NULL,
  group_key CHAR(1) NOT NULL,
  yellow_cards INTEGER DEFAULT 0,
  two_yellow_red INTEGER DEFAULT 0,
  direct_red INTEGER DEFAULT 0,
  fair_play_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, group_key)
);

CREATE INDEX IF NOT EXISTS idx_team_statistics_group ON team_statistics (group_key);

COMMENT ON TABLE team_statistics IS '팀별 카드 및 페어플레이 통계';
COMMENT ON COLUMN team_statistics.fair_play_points IS '옐로카드=1점, 2장누적퇴장=3점, 직접퇴장=4점';

-- 4. API 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS api_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  fixtures_synced INTEGER DEFAULT 0,
  teams_synced INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_sync_log_date ON api_sync_log (synced_at DESC);

COMMENT ON TABLE api_sync_log IS 'API 동기화 이력 및 에러 추적';

-- 5. 뷰: 팀별 종합 통계
DROP VIEW IF EXISTS v_team_full_stats;

CREATE VIEW v_team_full_stats AS
SELECT
  ts.team_id,
  ts.group_key,
  ts.yellow_cards,
  ts.two_yellow_red,
  ts.direct_red,
  ts.fair_play_points,
  COUNT(DISTINCT mr.id) FILTER (WHERE mr.home_id = ts.team_id OR mr.away_id = ts.team_id) as matches_played,
  ts.updated_at
FROM team_statistics ts
LEFT JOIN match_results mr ON (mr.home_id = ts.team_id OR mr.away_id = ts.team_id)
  AND mr.group_key = ts.group_key
GROUP BY ts.team_id, ts.group_key, ts.yellow_cards, ts.two_yellow_red, ts.direct_red, ts.fair_play_points, ts.updated_at;

COMMENT ON VIEW v_team_full_stats IS '팀별 경기 결과 + 카드 통계 통합 뷰';

-- 6. 초기 데이터: 48개 팀의 team_statistics 레코드 생성
INSERT INTO team_statistics (team_id, group_key, yellow_cards, two_yellow_red, direct_red, fair_play_points)
VALUES
  -- Group A
  ('MEX', 'A', 0, 0, 0, 0),
  ('KOR', 'A', 0, 0, 0, 0),
  ('RSA', 'A', 0, 0, 0, 0),
  ('UEFA_PO_D', 'A', 0, 0, 0, 0),
  -- Group B
  ('CAN', 'B', 0, 0, 0, 0),
  ('CHE', 'B', 0, 0, 0, 0),
  ('QAT', 'B', 0, 0, 0, 0),
  ('UEFA_PO_A', 'B', 0, 0, 0, 0),
  -- Group C
  ('BRA', 'C', 0, 0, 0, 0),
  ('MAR', 'C', 0, 0, 0, 0),
  ('SCO', 'C', 0, 0, 0, 0),
  ('HTI', 'C', 0, 0, 0, 0),
  -- Group D
  ('USA', 'D', 0, 0, 0, 0),
  ('AUS', 'D', 0, 0, 0, 0),
  ('PAR', 'D', 0, 0, 0, 0),
  ('UEFA_PO_C', 'D', 0, 0, 0, 0),
  -- Group E
  ('GER', 'E', 0, 0, 0, 0),
  ('ECU', 'E', 0, 0, 0, 0),
  ('CIV', 'E', 0, 0, 0, 0),
  ('CUW', 'E', 0, 0, 0, 0),
  -- Group F
  ('NED', 'F', 0, 0, 0, 0),
  ('JPN', 'F', 0, 0, 0, 0),
  ('TUN', 'F', 0, 0, 0, 0),
  ('UEFA_PO_B', 'F', 0, 0, 0, 0),
  -- Group G
  ('BEL', 'G', 0, 0, 0, 0),
  ('IRN', 'G', 0, 0, 0, 0),
  ('EGY', 'G', 0, 0, 0, 0),
  ('NZL', 'G', 0, 0, 0, 0),
  -- Group H
  ('ESP', 'H', 0, 0, 0, 0),
  ('URU', 'H', 0, 0, 0, 0),
  ('SAU', 'H', 0, 0, 0, 0),
  ('CPV', 'H', 0, 0, 0, 0),
  -- Group I
  ('FRA', 'I', 0, 0, 0, 0),
  ('SEN', 'I', 0, 0, 0, 0),
  ('NOR', 'I', 0, 0, 0, 0),
  ('IC_PO_2', 'I', 0, 0, 0, 0),
  -- Group J
  ('ARG', 'J', 0, 0, 0, 0),
  ('AUT', 'J', 0, 0, 0, 0),
  ('ALG', 'J', 0, 0, 0, 0),
  ('JOR', 'J', 0, 0, 0, 0),
  -- Group K
  ('POR', 'K', 0, 0, 0, 0),
  ('COL', 'K', 0, 0, 0, 0),
  ('UZB', 'K', 0, 0, 0, 0),
  ('IC_PO_1', 'K', 0, 0, 0, 0),
  -- Group L
  ('ENG', 'L', 0, 0, 0, 0),
  ('CRO', 'L', 0, 0, 0, 0),
  ('GHA', 'L', 0, 0, 0, 0),
  ('PAN', 'L', 0, 0, 0, 0)
ON CONFLICT (team_id, group_key) DO NOTHING;

-- 완료 메시지
SELECT '✅ 스키마 생성 완료!' AS message;
