-- FIFA Rankings table for 2026 World Cup teams (SQLite compatible)
CREATE TABLE IF NOT EXISTS fifa_rankings (
  team_code         TEXT PRIMARY KEY,
  team_name         TEXT NOT NULL,
  fifa_rank         INTEGER NOT NULL,
  fifa_points       REAL NOT NULL,
  confederation     TEXT NOT NULL,
  pot_assignment    INTEGER,
  updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fifa_rank ON fifa_rankings(fifa_rank);
CREATE INDEX IF NOT EXISTS idx_pot ON fifa_rankings(pot_assignment);

-- Insert FIFA Rankings (March/April 2026)
INSERT INTO fifa_rankings (team_code, team_name, fifa_rank, fifa_points, confederation, pot_assignment) VALUES
-- Pot 1 (3 hosts + top 9 non-hosts)
('ESP', 'Spain', 1, 1877.18, 'UEFA', 1),
('ARG', 'Argentina', 2, 1873.33, 'CONMEBOL', 1),
('FRA', 'France', 3, 1870.00, 'UEFA', 1),
('ENG', 'England', 4, 1834.12, 'UEFA', 1),
('BRA', 'Brazil', 5, 1760.46, 'CONMEBOL', 1),
('POR', 'Portugal', 6, 1760.38, 'UEFA', 1),
('NED', 'Netherlands', 7, 1756.27, 'UEFA', 1),
('MAR', 'Morocco', 8, 1736.57, 'CAF', 1),
('BEL', 'Belgium', 9, 1730.71, 'UEFA', 1),
('GER', 'Germany', 10, 1724.15, 'UEFA', 1),
('MEX', 'Mexico', 16, 1679.74, 'CONCACAF', 1),  -- Host
('USA', 'USA', 15, 1681.88, 'CONCACAF', 1),     -- Host
('CAN', 'Canada', 29, 1559.15, 'CONCACAF', 1),  -- Host

-- Pot 2 (ranks 11-22, excluding hosts)
('CRO', 'Croatia', 11, 1716.88, 'UEFA', 2),
('SEN', 'Senegal', 12, 1706.83, 'CAF', 2),
('COL', 'Colombia', 14, 1701.30, 'CONMEBOL', 2),
('URU', 'Uruguay', 17, 1672.62, 'CONMEBOL', 2),
('CHE', 'Switzerland', 18, 1654.69, 'UEFA', 2),
('JPN', 'Japan', 19, 1650.12, 'AFC', 2),
('IRN', 'IR Iran', 20, 1617.02, 'AFC', 2),
('KOR', 'Korea Republic', 22, 1599.45, 'AFC', 2),
('ECU', 'Ecuador', 23, 1591.73, 'CONMEBOL', 2),
('AUT', 'Austria', 24, 1585.51, 'UEFA', 2),
('AUS', 'Australia', 27, 1574.01, 'AFC', 2),
('ALG', 'Algeria', 28, 1560.91, 'CAF', 2),

-- Pot 3 (ranks 30-41)
('EGY', 'Egypt', 31, 1556.71, 'CAF', 3),
('NOR', 'Norway', 32, 1553.14, 'UEFA', 3),
('PAN', 'Panama', 33, 1537.61, 'CONCACAF', 3),
('CIV', 'Côte d''Ivoire', 37, 1522.48, 'CAF', 3),
('SCO', 'Scotland', 38, 1506.77, 'UEFA', 3),
('PAR', 'Paraguay', 40, 1501.50, 'CONMEBOL', 3),
('TUN', 'Tunisia', 47, 1479.04, 'CAF', 3),
('UZB', 'Uzbekistan', 60, 1425.00, 'AFC', 3),  -- Estimated
('GHA', 'Ghana', 65, 1410.00, 'CAF', 3),        -- Estimated
('SAU', 'Saudi Arabia', 55, 1440.00, 'AFC', 3), -- Estimated
('RSA', 'South Africa', 58, 1430.00, 'CAF', 3), -- Estimated
('JOR', 'Jordan', 70, 1390.00, 'AFC', 3),        -- Estimated

-- Pot 4 (lowest ranked teams + playoff winners)
('QAT', 'Qatar', 75, 1370.00, 'AFC', 4),
('HTI', 'Haiti', 82, 1340.00, 'CONCACAF', 4),
('CUW', 'Curaçao', 88, 1320.00, 'CONCACAF', 4),
('NZL', 'New Zealand', 85, 1330.00, 'OFC', 4),
('CPV', 'Cape Verde', 80, 1350.00, 'CAF', 4);
