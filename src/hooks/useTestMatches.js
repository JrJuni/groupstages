/**
 * useTestMatches — API 없이 로컬 상태 사용하는 테스트용 훅
 * localStorage로 점수 영속화 / 새로고침 시 복구 / MOCK_RESULTS로 초기 데이터
 */
import { useState, useCallback, useEffect } from 'react';
import { INITIAL_GROUPS } from '../leagues/worldcup2026/data.js';
import { MOCK_RESULTS } from '../data/mockResults.js';
import { createInitialMatches, calculateStandings } from '../utils/rankings.js';

const LS_KEY_TEST_SCORES = 'gs_testScores';

/**
 * localStorage에서 저장된 점수를 복구하여 groups 빌드
 */
function buildGroupsWithMockResults() {
  // localStorage에서 사용자 입력 점수 복구
  let savedScores = {};
  try {
    const raw = localStorage.getItem(LS_KEY_TEST_SCORES);
    if (raw) savedScores = JSON.parse(raw);
  } catch (_) { /* ignore */ }

  const groups = {};

  Object.entries(INITIAL_GROUPS).forEach(([key, { teams }]) => {
    const rawMatches = createInitialMatches(teams);

    const matches = rawMatches.map((m) => {
      // 우선순위: localStorage > MOCK_RESULTS > 빈값
      const saved = savedScores[m.id];
      if (saved) {
        return {
          ...m,
          homeScore: saved.home,
          awayScore: saved.away,
          played: saved.home !== '' && saved.away !== '',
        };
      }
      const [h, a] = m.id.split('_vs_');
      const mock = MOCK_RESULTS[m.id] || MOCK_RESULTS[`${a}_vs_${h}`];
      if (mock) {
        return {
          ...m,
          homeScore: String(mock.home),
          awayScore: String(mock.away),
          played: true,
        };
      }
      return m;
    });

    groups[key] = {
      teams,
      standings: calculateStandings(teams, matches),
      matches,
    };
  });

  return groups;
}

/**
 * 현재 groups에서 사용자가 입력/수정한 점수를 추출
 */
function extractScores(groups) {
  const scores = {};
  for (const [, { matches }] of Object.entries(groups)) {
    for (const m of matches) {
      if (m.homeScore !== null && m.homeScore !== undefined && m.homeScore !== '' ||
          m.awayScore !== null && m.awayScore !== undefined && m.awayScore !== '') {
        scores[m.id] = { home: m.homeScore ?? '', away: m.awayScore ?? '' };
      }
    }
  }
  return scores;
}

export function useTestMatches() {
  const [groups, setGroups] = useState(() => buildGroupsWithMockResults());

  // groups 변경 시 점수를 localStorage에 저장
  useEffect(() => {
    const scores = extractScores(groups);
    localStorage.setItem(LS_KEY_TEST_SCORES, JSON.stringify(scores));
  }, [groups]);

  const handleScoreChange = useCallback((groupKey, matchId, field, value) => {
    setGroups((prev) => {
      const group = prev[groupKey];
      const newMatches = group.matches.map((m) => {
        if (m.id !== matchId) return m;
        const updated = { ...m, [field]: value };
        updated.played =
          updated.homeScore !== null && updated.homeScore !== '' &&
          updated.awayScore !== null && updated.awayScore !== '';
        return updated;
      });
      const newStandings = calculateStandings(group.teams, newMatches);
      return { ...prev, [groupKey]: { ...group, matches: newMatches, standings: newStandings } };
    });
  }, []);

  const handleCardChange = useCallback((groupKey, teamId, field, value) => {
    setGroups((prev) => {
      const group = prev[groupKey];
      const newTeams = group.teams.map((t) =>
        t.id !== teamId ? t : { ...t, [field]: parseInt(value) || 0 }
      );
      const newStandings = calculateStandings(newTeams, group.matches);
      return { ...prev, [groupKey]: { ...group, teams: newTeams, standings: newStandings } };
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(LS_KEY_TEST_SCORES);
    setGroups(buildGroupsWithMockResults());
  }, []);

  return {
    groups,
    loading: false,
    apiAvailable: false,
    handleScoreChange,
    handleCardChange,
    resetAll,
  };
}
