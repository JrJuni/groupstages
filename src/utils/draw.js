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
import {
  HOST_PRE_PLACEMENTS,
  TOP_SEED_IDS,
  GROUP_QUARTERS,
} from '../leagues/worldcup2026/data.js';

const TOP_SEED_SET = new Set(TOP_SEED_IDS);

/**
 * FIFA 2026 추첨 제약 조건
 *
 * 1) 컨페더레이션 제약: UEFA는 그룹당 최대 2팀, 그 외는 최대 1팀
 * 2) 톱4 시드(스페인/아르헨티나/프랑스/잉글랜드) quarter 분리:
 *    각 시드가 KNOCKOUT_BRACKET 상 4개 quarter에 1팀씩 배정되어
 *    결승 이전에 만나지 않도록 함
 *
 * @param {Object} group - 검사 대상 그룹
 * @param {Object} team  - 배정 대상 팀
 * @param {Object} state - 현재 추첨 상태 (전체 그룹 정보 접근용)
 */
function fifaConstraintChecker(group, team, state) {
  // 1) 컨페더레이션 제약
  const confCount = group.teams.filter(
    (t) => t.confederation === team.confederation
  ).length;
  if (team.confederation === 'UEFA') {
    if (confCount >= 2) return false;
  } else {
    if (confCount >= 1) return false;
  }

  // 2) 톱4 시드 quarter 분리
  if (TOP_SEED_SET.has(team.id) && state) {
    const targetQuarter = GROUP_QUARTERS[group.name];
    if (targetQuarter) {
      for (const g of state.groups) {
        if (g.name === group.name) continue;
        if (GROUP_QUARTERS[g.name] !== targetQuarter) continue;
        const hasOtherTopSeed = g.teams.some(
          (t) => TOP_SEED_SET.has(t.id) && t.id !== team.id
        );
        if (hasOtherTopSeed) return false;
      }
    }
  }

  return true;
}

const FIFA_DRAW_OPTIONS = {
  groupNames: 'ABCDEFGHIJKL'.split(''),
  teamsPerGroup: 4,
  constraintChecker: fifaConstraintChecker,
  prePlacements: HOST_PRE_PLACEMENTS,
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

export function checkConstraints(group, team, state) {
  return fifaConstraintChecker(group, team, state);
}

export { drawOneTeam, getEligibleGroups };
