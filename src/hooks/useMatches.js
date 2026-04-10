import { useState, useEffect, useCallback } from 'react';
import { createInitialStandings, createInitialMatches, calculateStandings } from '../utils/rankings.js';
import { API_BASE } from '../config.js';

function buildEmptyGroups(leagueGroups) {
  const groups = {};
  Object.entries(leagueGroups).forEach(([key, { teams }]) => {
    groups[key] = {
      teams,
      standings: createInitialStandings(teams),
      matches: createInitialMatches(teams),
    };
  });
  return groups;
}

/**
 * @param {Object} [leagueConfig] - LeagueConfig 객체. 없으면 FIFA 2026 기본값 사용.
 */
export function useMatches(leagueConfig) {
  const leagueGroups = leagueConfig.groups;

  const [groups, setGroups] = useState(() => buildEmptyGroups(leagueGroups));
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  // API에서 저장된 경기 결과 로드
  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch(`${API_BASE}/matches`);
        if (!res.ok) throw new Error('API 응답 오류');
        const rows = await res.json();

        if (rows.length > 0) {
          setGroups((prev) => {
            const next = { ...prev };
            rows.forEach((row) => {
              const g = row.group_key;
              if (!next[g]) return;
              const group = next[g];
              const newMatches = group.matches.map((m) => {
                // 양방향 매칭 (엔진 ID와 DB ID 방향이 다를 수 있음)
                const [rh, ra] = row.id.split('_vs_');
                const altRowId = `${ra}_vs_${rh}`;
                if (m.id !== row.id && m.id !== altRowId) return m;
                const hs = row.home_score !== null ? String(row.home_score) : null;
                const as_ = row.away_score !== null ? String(row.away_score) : null;
                // DB home/away 순서가 엔진과 다를 수 있으므로 스왑 처리
                const isSwapped = m.id !== row.id;
                return {
                  ...m,
                  homeScore: isSwapped ? as_ : hs,
                  awayScore: isSwapped ? hs : as_,
                  played: hs !== null && as_ !== null,
                  matchday: row.matchday ?? m.matchday,
                  date: row.match_date ?? m.date,
                  venue: row.venue ?? m.venue,
                  city: row.city ?? m.city,
                };
              });
              const newStandings = calculateStandings(group.teams, newMatches);
              next[g] = { ...group, matches: newMatches, standings: newStandings };
            });
            return { ...next };
          });
        }
        setApiAvailable(true);
      } catch (err) {
        console.warn('[useMatches] API 미연결, 로컬 모드:', err.message);
        setApiAvailable(false);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  // 점수 변경: 로컬 상태 업데이트 + DB 저장
  const handleScoreChange = useCallback(
    async (groupKey, matchId, field, value) => {
      let updatedMatch = null;

      setGroups((prev) => {
        const group = prev[groupKey];
        const newMatches = group.matches.map((m) => {
          if (m.id !== matchId) return m;
          const updated = { ...m, [field]: value };
          updated.played =
            updated.homeScore !== null &&
            updated.homeScore !== '' &&
            updated.awayScore !== null &&
            updated.awayScore !== '';
          updatedMatch = updated;
          return updated;
        });
        const newStandings = calculateStandings(group.teams, newMatches);
        return { ...prev, [groupKey]: { ...group, matches: newMatches, standings: newStandings } };
      });

      if (updatedMatch && apiAvailable) {
        try {
          await fetch(`${API_BASE}/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: updatedMatch.id,
              group_key: groupKey,
              home_id: updatedMatch.home,
              away_id: updatedMatch.away,
              home_score: updatedMatch.homeScore,
              away_score: updatedMatch.awayScore,
            }),
          });
        } catch (err) {
          console.warn('[useMatches] 저장 실패:', err.message);
        }
      }
    },
    [apiAvailable]
  );

  // 카드 변경
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

  // 전체 초기화
  const resetAll = useCallback(async () => {
    if (leagueGroups) {
      setGroups(buildEmptyGroups(leagueGroups));
    }
    if (apiAvailable) {
      try {
        await fetch(`${API_BASE}/matches`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[useMatches] 초기화 실패:', err.message);
      }
    }
  }, [apiAvailable, leagueGroups]);

  return { groups, loading, apiAvailable, handleScoreChange, handleCardChange, resetAll };
}
