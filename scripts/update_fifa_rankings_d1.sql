-- SQLite version: Recreate table with new schema
-- (SQLite doesn't support RENAME COLUMN easily)

-- Create new table with updated schema
CREATE TABLE fifa_rankings_new (
  team_code         TEXT PRIMARY KEY,
  team_name         TEXT NOT NULL,
  fifa_rank_current INTEGER NOT NULL,
  fifa_rank_draw    INTEGER NOT NULL,
  fifa_points       REAL NOT NULL,
  confederation     TEXT NOT NULL,
  pot_assignment    INTEGER,
  updated_at        TEXT DEFAULT (datetime('now'))
);

-- Copy data from old table
INSERT INTO fifa_rankings_new
  (team_code, team_name, fifa_rank_current, fifa_rank_draw, fifa_points, confederation, pot_assignment, updated_at)
SELECT
  team_code, team_name, fifa_rank, fifa_rank, fifa_points, confederation, pot_assignment, updated_at
FROM fifa_rankings;

-- Drop old table
DROP TABLE fifa_rankings;

-- Rename new table to original name
ALTER TABLE fifa_rankings_new RENAME TO fifa_rankings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_fifa_rank_current ON fifa_rankings(fifa_rank_current);
CREATE INDEX IF NOT EXISTS idx_fifa_rank_draw ON fifa_rankings(fifa_rank_draw);
CREATE INDEX IF NOT EXISTS idx_pot ON fifa_rankings(pot_assignment);
