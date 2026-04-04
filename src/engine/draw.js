/**
 * 범용 조추첨 시뮬레이션 엔진
 * 조 이름, 조당 팀 수, 제약조건 함수를 파라미터로 주입
 */

/**
 * @param {Object} pots           - { pot1: [...], pot2: [...], ... }
 * @param {Object} [options]
 * @param {string[]} [options.groupNames]       - 조 이름 배열 (e.g. ['A','B',...,'L'])
 * @param {number}   [options.teamsPerGroup=4]  - 조당 팀 수
 * @param {Function} [options.constraintChecker] - (group, team) => boolean
 */
export function createInitialDrawState(pots, options = {}) {
  const {
    groupNames = 'ABCDEFGHIJKL'.split(''),
    teamsPerGroup = 4,
  } = options;

  const groups = groupNames.map((g) => ({
    name: g,
    teams: [],
  }));

  return {
    groups,
    remainingPots: Object.fromEntries(
      Object.entries(pots).map(([key, teams]) => [key, [...teams]])
    ),
    currentTeam: null,
    history: [],
    isComplete: false,
    _options: { teamsPerGroup, ...options },
  };
}

// 기본 제약조건: 대륙 제한 없음
const DEFAULT_CONSTRAINT = () => true;

function getEligibleGroups(groups, team, teamsPerGroup, constraintChecker) {
  return groups.filter(
    (g) => g.teams.length < teamsPerGroup && constraintChecker(g, team)
  );
}

function isFeasible(groups, remainingTeams, teamsPerGroup, constraintChecker) {
  return remainingTeams.every(
    (team) => getEligibleGroups(groups, team, teamsPerGroup, constraintChecker).length > 0
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

  for (const drawnTeam of shuffled) {
    const eligible = getEligibleGroups(state.groups, drawnTeam, teamsPerGroup, constraintChecker);
    if (eligible.length === 0) continue;

    const shuffledGroups = [...eligible].sort(() => Math.random() - 0.5);
    for (const targetGroup of shuffledGroups) {
      const newGroups = state.groups.map((g) =>
        g.name === targetGroup.name
          ? { ...g, teams: [...g.teams, drawnTeam] }
          : g
      );
      const remainingAfter = pot.filter((t) => t.id !== drawnTeam.id);

      if (remainingAfter.length === 0 || isFeasible(newGroups, remainingAfter, teamsPerGroup, constraintChecker)) {
        const newPot = pot.filter((t) => t.id !== drawnTeam.id);
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

  // 강제 배정
  for (const drawnTeam of shuffled) {
    const eligible = getEligibleGroups(state.groups, drawnTeam, teamsPerGroup, constraintChecker);
    if (eligible.length > 0) {
      const targetGroup = eligible[0];
      const newGroups = state.groups.map((g) =>
        g.name === targetGroup.name
          ? { ...g, teams: [...g.teams, drawnTeam] }
          : g
      );
      const newPot = pot.filter((t) => t.id !== drawnTeam.id);
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

  // 제약 완화 강제 배정
  const fallbackTeam = shuffled[0];
  const fallbackGroups = state.groups.filter((g) => g.teams.length < teamsPerGroup);
  if (fallbackGroups.length > 0) {
    const targetGroup = fallbackGroups[0];
    const newGroups = state.groups.map((g) =>
      g.name === targetGroup.name
        ? { ...g, teams: [...g.teams, fallbackTeam] }
        : g
    );
    const newPot = pot.filter((t) => t.id !== fallbackTeam.id);
    return {
      ...state,
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

/**
 * 전체 추첨 자동 실행
 * @param {Object} pots
 * @param {Object} [options] - createInitialDrawState와 동일한 options
 */
export function runFullDraw(pots, options = {}) {
  const { teamsPerGroup = 4, groupNames } = options;
  let state = createInitialDrawState(pots, options);
  const potOrder = Object.keys(pots);

  for (const pot of potOrder) {
    while (state.remainingPots[pot].length > 0) {
      const prev = state.remainingPots[pot].length;
      state = drawOneTeam(state, pot);
      if (state.remainingPots[pot].length === prev) break;
    }
  }

  const expectedTotal = (groupNames || 'ABCDEFGHIJKL'.split('')).length * teamsPerGroup;
  const totalAssigned = state.groups.reduce((sum, g) => sum + g.teams.length, 0);
  return { ...state, isComplete: totalAssigned === expectedTotal };
}

/**
 * 추첨 애니메이션용 스텝별 실행
 */
export function generateDrawSteps(pots, options = {}) {
  const { teamsPerGroup = 4, groupNames } = options;
  let state = createInitialDrawState(pots, options);
  const steps = [];
  const potOrder = Object.keys(pots);
  const expectedTotal = (groupNames || 'ABCDEFGHIJKL'.split('')).length * teamsPerGroup;

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

  return steps;
}

// getEligibleGroups 외부 공개 (DrawSimulator에서 사용)
export { getEligibleGroups };
