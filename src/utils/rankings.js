/**
 * FIFA 2026 World Cup 바��딩 shim
 * 기존 import 경로를 유지하면서 engine/rankings.js의 범용 알고리즘에
 * FIFA 고유 데이터(시드, 랭킹, 일정)를 바인딩하여 re-export
 */
import { TEAM_SEEDS, FIFA_RANKINGS, MATCH_SCHEDULE } from '../leagues/worldcup2026/data.js';
import {
  createInitialStandings as _createInitialStandings,
  createInitialMatches as _createInitialMatches,
  calculateStandings as _calculateStandings,
  getFairPlayPoints as _getFairPlayPoints,
  getBestThirdPlace,
} from '../engine/rankings.js';

// ── FIFA 고유 타이브레이커 ──────────────────────────────────
const fifaTiebreakers = [
  // 페어플레이 이후: FIFA 랭킹 → 시드 순서
  (a, b) => (FIFA_RANKINGS[a.id] ?? 999) - (FIFA_RANKINGS[b.id] ?? 999),
  (a, b) => (TEAM_SEEDS[a.id] ?? 99) - (TEAM_SEEDS[b.id] ?? 99),
];

const FIFA_OPTIONS = { tiebreakers: fifaTiebreakers };

// ── Re-exports (기존 인터페이스 유지) ───────────────────────
export { _createInitialStandings as createInitialStandings };

export function getFairPlayPoints(team) {
  return _getFairPlayPoints(team);
}

export function createInitialMatches(teams) {
  return _createInitialMatches(teams, MATCH_SCHEDULE);
}

export function calculateStandings(teams, matches) {
  return _calculateStandings(teams, matches, FIFA_OPTIONS);
}

export function getBest8ThirdPlace(allGroupStandings) {
  return getBestThirdPlace(allGroupStandings, 8, FIFA_OPTIONS);
}
