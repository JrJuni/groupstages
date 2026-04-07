/**
 * FIFA 2026 바인딩 shim — engine/groupRankPossibilities를 FIFA 타이브레이커와 함께 사용
 */
import { computeGroupRankPossibilities as _compute } from '../engine/groupRankPossibilities.js';
import { TEAM_SEEDS, FIFA_RANKINGS } from '../leagues/worldcup2026/data.js';

const fifaTiebreakers = [
  (a, b) => (FIFA_RANKINGS[a.id] ?? 999) - (FIFA_RANKINGS[b.id] ?? 999),
  (a, b) => (TEAM_SEEDS[a.id] ?? 99) - (TEAM_SEEDS[b.id] ?? 99),
];

const FIFA_OPTIONS = { tiebreakers: fifaTiebreakers };

export function computeGroupRankPossibilities(teams, matches) {
  return _compute(teams, matches, FIFA_OPTIONS);
}

export function computeAllGroupRankPossibilities(groups) {
  const out = {};
  for (const [key, { teams, matches }] of Object.entries(groups)) {
    out[key] = _compute(teams, matches, FIFA_OPTIONS);
  }
  return out;
}
