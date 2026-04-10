/**
 * 범용 조추첨 시뮬레이션 엔진
 * 조 이름, 조당 팀 수, 제약조건 함수를 파라미터로 주입
 */

/**
 * @param {Object} pots           - { pot1: [...], pot2: [...], ... }
 * @param {Object} [options]
 * @param {string[]} [options.groupNames]       - 조 이름 배열 (e.g. ['A','B',...,'L'])
 * @param {number}   [options.teamsPerGroup=4]  - 조당 팀 수
 * @param {Function} [options.constraintChecker] - (group, team, state) => boolean
 * @param {Array}    [options.prePlacements]    - [{ teamId, groupName, potKey }, ...]
 *                                                 사전 배정 팀 (예: 호스트). 시작 시점에
 *                                                 해당 그룹에 배정되고 pot에서 제거됨.
 */
export function createInitialDrawState(pots, options = {}) {
  const {
    groupNames = 'ABCDEFGHIJKL'.split(''),
    teamsPerGroup = 4,
    prePlacements = [],
  } = options;

  const groups = groupNames.map((g) => ({
    name: g,
    teams: [],
  }));

  const remainingPots = Object.fromEntries(
    Object.entries(pots).map(([key, teams]) => [key, [...teams]])
  );

  const history = [];

  // 사전 배정 적용 (호스트 등)
  for (const { teamId, groupName, potKey } of prePlacements) {
    const pool = remainingPots[potKey];
    if (!pool) continue;
    const teamIdx = pool.findIndex((t) => t.id === teamId);
    if (teamIdx === -1) continue;
    const targetGroup = groups.find((g) => g.name === groupName);
    if (!targetGroup) continue;
    if (targetGroup.teams.length >= teamsPerGroup) continue;

    const team = { ...pool[teamIdx], _drawnFromPot: potKey };
    targetGroup.teams.push(team);
    pool.splice(teamIdx, 1);
    history.push({ team, group: groupName, pot: potKey, prePlaced: true });
  }

  return {
    groups,
    remainingPots,
    currentTeam: null,
    history,
    isComplete: false,
    _options: { teamsPerGroup, ...options },
  };
}

// 기본 제약조건: 대륙 제한 없음
const DEFAULT_CONSTRAINT = () => true;

// 각 그룹에 동일 pot 팀이 이미 있는지 확인 (1 pot per group 룰)
function groupHasPot(group, potKey) {
  return potKey != null && group.teams.some((t) => t._drawnFromPot === potKey);
}

function getEligibleGroups(groups, team, teamsPerGroup, constraintChecker, state, potKey) {
  return groups.filter((g) => {
    if (g.teams.length >= teamsPerGroup) return false;
    if (groupHasPot(g, potKey)) return false;
    return constraintChecker(g, team, state);
  });
}

function isFeasible(groups, remainingTeams, teamsPerGroup, constraintChecker, state, potKey) {
  return remainingTeams.every(
    (team) => getEligibleGroups(groups, team, teamsPerGroup, constraintChecker, state, potKey).length > 0
  );
}

/**
 * 한 팀 추첨
 */
export function drawOneTeam(state, potKey) {
  const { _options = {} } = state;
  const {
    teamsPerGroup = 4,
    constraintChecker = DEFAULT_CONSTRAINT,
  } = _options;

  const pot = [...state.remainingPots[potKey]];
  if (pot.length === 0) return state;

  const shuffled = [...pot].sort(() => Math.random() - 0.5);

  for (const rawTeam of shuffled) {
    const drawnTeam = { ...rawTeam, _drawnFromPot: potKey };
    const eligible = getEligibleGroups(state.groups, drawnTeam, teamsPerGroup, constraintChecker, state, potKey);
    if (eligible.length === 0) continue;

    const shuffledGroups = [...eligible].sort(() => Math.random() - 0.5);
    for (const targetGroup of shuffledGroups) {
      const newGroups = state.groups.map((g) =>
        g.name === targetGroup.name
          ? { ...g, teams: [...g.teams, drawnTeam] }
          : g
      );
      const remainingAfter = pot.filter((t) => t.id !== rawTeam.id);
      const probeState = { ...state, groups: newGroups };

      if (remainingAfter.length === 0 || isFeasible(newGroups, remainingAfter, teamsPerGroup, constraintChecker, probeState, potKey)) {
        const newPot = pot.filter((t) => t.id !== rawTeam.id);
        return {
          ...state,
          groups: newGroups,
          remainingPots: { ...state.remainingPots, [potKey]: newPot },
          currentTeam: drawnTeam,
          history: [
            ...state.history,
            { team: drawnTeam, group: targetGroup.name, pot: potKey },
          ],
        };
      }
    }
  }

  // 강제 배정 (feasibility 검증 없이 제약만 통과하는 첫 그룹)
  // — 1단계 통과 실패 = 후속 pot가 막힐 가능성. fallback 플래그 표시
  for (const rawTeam of shuffled) {
    const drawnTeam = { ...rawTeam, _drawnFromPot: potKey };
    const eligible = getEligibleGroups(state.groups, drawnTeam, teamsPerGroup, constraintChecker, state, potKey);
    if (eligible.length > 0) {
      const targetGroup = eligible[0];
      const newGroups = state.groups.map((g) =>
        g.name === targetGroup.name
          ? { ...g, teams: [...g.teams, drawnTeam] }
          : g
      );
      const newPot = pot.filter((t) => t.id !== rawTeam.id);
      return {
        ...state,
        _fallbackTriggered: true,
        groups: newGroups,
        remainingPots: { ...state.remainingPots, [potKey]: newPot },
        currentTeam: drawnTeam,
        history: [
          ...state.history,
          { team: drawnTeam, group: targetGroup.name, pot: potKey },
        ],
      };
    }
  }

  // 제약 완화 강제 배정 (정상 동작 시 발동되어선 안 됨)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[draw] constraint fallback triggered for pot', potKey);
  }
  const fallbackTeam = { ...shuffled[0], _drawnFromPot: potKey };
  const fallbackGroups = state.groups.filter((g) => g.teams.length < teamsPerGroup);
  if (fallbackGroups.length > 0) {
    const targetGroup = fallbackGroups[0];
    const newGroups = state.groups.map((g) =>
      g.name === targetGroup.name
        ? { ...g, teams: [...g.teams, fallbackTeam] }
        : g
    );
    const newPot = pot.filter((t) => t.id !== shuffled[0].id);
    return {
      ...state,
      _fallbackTriggered: true,
      groups: newGroups,
      remainingPots: { ...state.remainingPots, [potKey]: newPot },
      currentTeam: fallbackTeam,
      history: [
        ...state.history,
        { team: fallbackTeam, group: targetGroup.name, pot: potKey },
      ],
    };
  }

  return state;
}

// 단일 추첨 시도 — 내부 헬퍼
function attemptDraw(pots, options) {
  const { teamsPerGroup = 4, groupNames = 'ABCDEFGHIJKL'.split('') } = options;
  let state = createInitialDrawState(pots, options);
  const potOrder = Object.keys(pots);

  for (const pot of potOrder) {
    while (state.remainingPots[pot].length > 0) {
      const prev = state.remainingPots[pot].length;
      state = drawOneTeam(state, pot);
      if (state.remainingPots[pot].length === prev) break;
    }
  }

  const expectedTotal = groupNames.length * teamsPerGroup;
  const totalAssigned = state.groups.reduce((sum, g) => sum + g.teams.length, 0);
  state = { ...state, isComplete: totalAssigned === expectedTotal };
  return state;
}

// 단일 추첨 시도 — steps 수집 (애니메이션용)
function attemptDrawWithSteps(pots, options) {
  const { teamsPerGroup = 4, groupNames = 'ABCDEFGHIJKL'.split('') } = options;
  let state = createInitialDrawState(pots, options);
  const steps = [];
  const potOrder = Object.keys(pots);
  const expectedTotal = groupNames.length * teamsPerGroup;

  for (const pot of potOrder) {
    while (state.remainingPots[pot].length > 0) {
      const prev = state.remainingPots[pot].length;
      state = drawOneTeam(state, pot);
      if (state.remainingPots[pot].length === prev) break;
      const totalAssigned = state.groups.reduce((s, g) => s + g.teams.length, 0);
      steps.push({
        ...state,
        stepPot: pot,
        stepTeam: state.currentTeam,
        isComplete: totalAssigned === expectedTotal,
      });
    }
  }

  const final = steps[steps.length - 1] ?? state;
  return { steps, finalState: final };
}

const MAX_DRAW_RETRIES = 200;

/**
 * 전체 추첨 자동 실행 (fallback 발동 시 재시도)
 * @param {Object} pots
 * @param {Object} [options] - createInitialDrawState와 동일한 options
 */
export function runFullDraw(pots, options = {}) {
  let last = null;
  for (let i = 0; i < MAX_DRAW_RETRIES; i++) {
    const state = attemptDraw(pots, options);
    if (state.isComplete && !state._fallbackTriggered) return state;
    last = state;
  }
  return last;
}

/**
 * 추첨 애니메이션용 스텝별 실행 (fallback 없는 결과를 찾을 때까지 재시도)
 */
export function generateDrawSteps(pots, options = {}) {
  let last = null;
  for (let i = 0; i < MAX_DRAW_RETRIES; i++) {
    const { steps, finalState } = attemptDrawWithSteps(pots, options);
    if (finalState.isComplete && !finalState._fallbackTriggered) return steps;
    last = steps;
  }
  return last;
}

// getEligibleGroups 외부 공개 (DrawSimulator에서 사용)
export { getEligibleGroups };
