// 조추첨 시뮬레이션 로직

export function createInitialDrawState(pots) {
  const groups = 'ABCDEFGHIJKL'.split('').map((g) => ({
    name: g,
    teams: [],
  }));

  return {
    groups,
    remainingPots: {
      pot1: [...pots.pot1],
      pot2: [...pots.pot2],
      pot3: [...pots.pot3],
      pot4: [...pots.pot4],
    },
    currentTeam: null,
    history: [],
    isComplete: false,
  };
}

// UEFA: 조당 최대 2팀, 나머지 대륙: 조당 최대 1팀
export function checkConstraints(group, team) {
  const confCount = group.teams.filter(
    (t) => t.confederation === team.confederation
  ).length;
  if (team.confederation === 'UEFA') return confCount < 2;
  return confCount < 1;
}

export function getEligibleGroups(groups, team) {
  return groups.filter(
    (g) => g.teams.length < 4 && checkConstraints(g, team)
  );
}

// 특정 팀이 배정 가능한지 전체 상태에서 확인 (미래 가능성 체크)
function isFeasible(groups, remainingTeams) {
  // 간단한 feasibility check: 각 팀이 최소 1개 이상의 eligible group이 있는지
  return remainingTeams.every(
    (team) => getEligibleGroups(groups, team).length > 0
  );
}

// 랜덤 추첨 한 단계 (제약 조건 검사 + 재시도 로직)
export function drawOneTeam(state, potKey, maxRetries = 100) {
  const pot = [...state.remainingPots[potKey]];
  if (pot.length === 0) return state;

  // 셔플된 순서로 팀을 시도 (제약 위반 시 다음 팀 시도)
  const shuffled = [...pot].sort(() => Math.random() - 0.5);

  for (const drawnTeam of shuffled) {
    const eligible = getEligibleGroups(state.groups, drawnTeam);
    if (eligible.length === 0) continue;

    // 가능한 조 중 랜덤 선택 (미래 feasibility 우선)
    const shuffledGroups = [...eligible].sort(() => Math.random() - 0.5);
    for (const targetGroup of shuffledGroups) {
      const newGroups = state.groups.map((g) =>
        g.name === targetGroup.name
          ? { ...g, teams: [...g.teams, drawnTeam] }
          : g
      );
      const remainingAfter = pot.filter((t) => t.id !== drawnTeam.id);

      // feasibility 확인
      if (remainingAfter.length === 0 || isFeasible(newGroups, remainingAfter)) {
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

  // 모든 시도 실패 시 강제 배정 (첫 번째 가능한 쌍)
  for (const drawnTeam of shuffled) {
    const eligible = getEligibleGroups(state.groups, drawnTeam);
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

  // 완전히 배정 불가 시 제약 조건 완화하여 강제 배정
  const fallbackTeam = shuffled[0];
  const fallbackGroups = state.groups.filter((g) => g.teams.length < 4);
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

// 전체 추첨 자동 실행
export function runFullDraw(pots) {
  let state = createInitialDrawState(pots);
  const potOrder = ['pot1', 'pot2', 'pot3', 'pot4'];

  for (const pot of potOrder) {
    let remaining = state.remainingPots[pot].length;
    while (state.remainingPots[pot].length > 0) {
      const prev = state.remainingPots[pot].length;
      state = drawOneTeam(state, pot);
      if (state.remainingPots[pot].length === prev) break; // 무한루프 방지
    }
  }

  const totalAssigned = state.groups.reduce((sum, g) => sum + g.teams.length, 0);
  return { ...state, isComplete: totalAssigned === 48 };
}

// 추첨 애니메이션용 스텝별 실행 데이터 생성
export function generateDrawSteps(pots) {
  let state = createInitialDrawState(pots);
  const steps = [];
  const potOrder = ['pot1', 'pot2', 'pot3', 'pot4'];

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
        isComplete: totalAssigned === 48,
      });
    }
  }

  return steps;
}
