/**
 * FIFA 2026 World Cup 바인딩 shim
 * engine/draw.js에 FIFA 조추첨 규칙을 바인딩하여 기존 인터페이스 유지
 */
import {
  createInitialDrawState as _createInitialDrawState,
  drawOneTeam,
  runFullDraw as _runFullDraw,
  generateDrawSteps as _generateDrawSteps,
  getEligibleGroups,
} from '../engine/draw.js';

// FIFA 조추첨 제약조건: UEFA 최대 2팀, 나머지 대륙 최대 1팀
function fifaConstraintChecker(group, team) {
  const confCount = group.teams.filter(
    (t) => t.confederation === team.confederation
  ).length;
  if (team.confederation === 'UEFA') return confCount < 2;
  return confCount < 1;
}

const FIFA_DRAW_OPTIONS = {
  groupNames: 'ABCDEFGHIJKL'.split(''),
  teamsPerGroup: 4,
  constraintChecker: fifaConstraintChecker,
};

export function createInitialDrawState(pots) {
  return _createInitialDrawState(pots, FIFA_DRAW_OPTIONS);
}

export function runFullDraw(pots) {
  return _runFullDraw(pots, FIFA_DRAW_OPTIONS);
}

export function generateDrawSteps(pots) {
  return _generateDrawSteps(pots, FIFA_DRAW_OPTIONS);
}

export function checkConstraints(group, team) {
  return fifaConstraintChecker(group, team);
}

export { drawOneTeam, getEligibleGroups };
