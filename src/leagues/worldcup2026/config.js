/**
 * 2026 FIFA World Cup - LeagueConfig
 */
import {
  INITIAL_GROUPS,
  MATCH_SCHEDULE,
  DRAW_POTS,
  TEAM_SEEDS,
  FIFA_RANKINGS,
  FIFA_RANKINGS_CURRENT,
  FIFA_RANKINGS_DRAW,
  THIRD_PLACE_GROUPS,
  KNOCKOUT_BRACKET,
  CONFEDERATIONS,
} from './data.js';

// ── FIFA 페어플레이 점수 ────────────────────────────────────
const fairPlayScore = (team) =>
  -1 * (team.yc || 0) + -3 * (team.twoYR || 0) + -4 * (team.dr || 0);

// ── FIFA 타이브레이커 (페어플레이 이후) ─────────────────────
const tiebreakers = [
  (a, b) => (FIFA_RANKINGS[a.id] ?? 999) - (FIFA_RANKINGS[b.id] ?? 999),
  (a, b) => (TEAM_SEEDS[a.id] ?? 99) - (TEAM_SEEDS[b.id] ?? 99),
];

// ── 조추첨 제약조건 ────────────────────────────────────────
const drawConstraintChecker = (group, team) => {
  const confCount = group.teams.filter(
    (t) => t.confederation === team.confederation
  ).length;
  if (team.confederation === 'UEFA') return confCount < 2;
  return confCount < 1;
};

// ── LeagueConfig 객체 ──────────────────────────────────────
/** @type {import('../../engine/types.js').LeagueConfig} */
const leagueConfig = {
  id: 'worldcup2026',
  name: '2026 FIFA World Cup',
  groupCount: 12,
  teamsPerGroup: 4,
  advancementSlots: 2,
  thirdPlaceAdvancing: 8,
  thirdPlaceMinPts: 4,
  fairPlayScore,
  tiebreakers,
  drawConstraintChecker,

  // 데이터
  groups: INITIAL_GROUPS,
  matchSchedule: MATCH_SCHEDULE,
  rankings: FIFA_RANKINGS,
  rankingsCurrent: FIFA_RANKINGS_CURRENT,
  rankingsDraw: FIFA_RANKINGS_DRAW,
  seeds: TEAM_SEEDS,
  drawPots: DRAW_POTS,
  thirdPlaceGroups: THIRD_PLACE_GROUPS,
  knockoutBracket: KNOCKOUT_BRACKET,
  confederations: CONFEDERATIONS,
};

export default leagueConfig;
