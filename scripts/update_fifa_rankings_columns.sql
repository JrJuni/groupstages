-- Add fifa_rank_draw column (ranking at draw time: Dec 5, 2025)
-- Rename fifa_rank to fifa_rank_current (current/live ranking)

-- PostgreSQL version
ALTER TABLE fifa_rankings
  RENAME COLUMN fifa_rank TO fifa_rank_current;

ALTER TABLE fifa_rankings
  ADD COLUMN fifa_rank_draw INTEGER;

-- For now, set draw rank = current rank (draw hasn't happened yet)
UPDATE fifa_rankings
  SET fifa_rank_draw = fifa_rank_current;

-- Update rankings table comment
COMMENT ON TABLE fifa_rankings IS '2026 World Cup FIFA Rankings - Dual column system for draw-time vs current rankings';
COMMENT ON COLUMN fifa_rankings.fifa_rank_draw IS 'FIFA ranking at draw time (Dec 5, 2025)';
COMMENT ON COLUMN fifa_rankings.fifa_rank_current IS 'Current FIFA ranking (updated monthly)';
