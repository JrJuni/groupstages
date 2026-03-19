/**
 * useTestMatches — API 없이 순수 로컬 상태만 사용하는 테스트용 훅
 * DB 저장 없음 / 새로고침 시 초기화 / MOCK_RESULTS로 MD1+MD2 사전 입력
 */
import { useState, useCallback } from 'react';
import { INITIAL_GROUPS } from '../data/worldcup2026.js';
import { MOCK_RESULTS } from '../data/mockResults.js';
import { createInitialStandings, createInitialMatches, calculateStandings } from '../utils/rankings.js';

function buildGroupsWithMockResults() {
  const groups = {};

  Object.entries(INITIAL_GROUPS).forEach(([key, { teams }]) => {
    const rawMatches = createInitialMatches(teams);

    const matches = rawMatches.map((m) => {
      const result = MOCK_RESULTS[m.id];
      if (!result) return m;
      return {
        ...m,
        homeScore: String(result.home),
        awayScore: String(result.away),
        played: true,
      };
    });

    groups[key] = {
      teams,
      standings: calculateStandings(teams, matches),
      matches,
    };
  });

  return groups;
}

export function useTestMatches() {
  const [groups, setGroups] = useState(() => buildGroupsWithMockResults());

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
