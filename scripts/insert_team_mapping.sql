-- ================================================================
-- 팀 ID 매핑 데이터 삽입
-- scripts/generateTeamMapping.js에서 생성된 데이터
-- ================================================================

INSERT INTO team_mapping (our_team_id, api_team_id, api_team_name, api_team_code)
VALUES
  ('MEX', 16, 'Mexico', 'MEX'),
  ('KOR', 17, 'South Korea', 'SOU'),
  ('RSA', 1531, 'South Africa', 'SOU'),
  ('CAN', 5529, 'Canada', 'CAN'),
  ('CHE', 15, 'Switzerland', 'SWI'),
  ('QAT', 1569, 'Qatar', 'QAT'),
  ('BRA', 6, 'Brazil', 'BRA'),
  ('MAR', 31, 'Morocco', 'MOR'),
  ('SCO', 1108, 'Scotland', 'SCO'),
  ('HTI', 2386, 'Haiti', 'HAI'),
  ('USA', 2384, 'USA', 'USA'),
  ('AUS', 20, 'Australia', 'AUS'),
  ('PAR', 2380, 'Paraguay', 'PAR'),
  ('GER', 25, 'Germany', 'GER'),
  ('ECU', 2382, 'Ecuador', 'ECU'),
  ('CIV', 1501, 'Ivory Coast', 'IVO'),
  ('NED', 1118, 'Netherlands', 'NET'),
  ('JPN', 12, 'Japan', 'JAP'),
  ('TUN', 28, 'Tunisia', 'TUN'),
  ('BEL', 1, 'Belgium', 'BEL'),
  ('IRN', 22, 'Iran', 'IRA'),
  ('EGY', 32, 'Egypt', 'EGY'),
  ('NZL', 4673, 'New Zealand', 'ZEA'),
  ('ESP', 9, 'Spain', 'SPA'),
  ('URU', 7, 'Uruguay', 'URU'),
  ('SAU', 23, 'Saudi Arabia', 'SAU'),
  ('FRA', 2, 'France', 'FRA'),
  ('SEN', 13, 'Senegal', 'SEN'),
  ('NOR', 1090, 'Norway', 'NOR'),
  ('ARG', 26, 'Argentina', 'ARG'),
  ('AUT', 775, 'Austria', 'AUS'),
  ('ALG', 1532, 'Algeria', 'ALG'),
  ('JOR', 1548, 'Jordan', 'JOR'),
  ('POR', 27, 'Portugal', 'POR'),
  ('COL', 8, 'Colombia', 'COL'),
  ('UZB', 1568, 'Uzbekistan', 'UZB'),
  ('ENG', 10, 'England', 'ENG'),
  ('CRO', 3, 'Croatia', 'CRO'),
  ('GHA', 1504, 'Ghana', 'GHA'),
  ('PAN', 11, 'Panama', 'PAN')
ON CONFLICT (our_team_id) DO UPDATE
  SET api_team_id = EXCLUDED.api_team_id,
      api_team_name = EXCLUDED.api_team_name,
      api_team_code = EXCLUDED.api_team_code;

SELECT '✅ 팀 매핑 데이터 삽입 완료! (' || COUNT(*) || '개 팀)' AS message
FROM team_mapping;
