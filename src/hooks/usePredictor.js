import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config.js';
import { buildPredictorFn } from '../engine/matchPredictor.js';

/**
 * ELO + 폼 fetch + matchPredictor 빌드 훅
 *
 * - 한 번 fetch 후 빌드 — 결과는 `(homeId, awayId) => { homeWeights, awayWeights } | null` 클로저
 * - 실패/누락/`?predictor=off` 시 `predictor: null` 반환 → scenarioComputer가 baseline fallback
 * - 호스트 팀 ID는 `leagueConfig.groups[].teams[].host` 에서 추출 → ELO supremacy에 HFA 0.30골 추가
 *
 * @param {Object} leagueConfig - LeagueConfig (host 정보 추출용)
 * @returns {{ predictor: Function | null, status: object }}
 */
export function usePredictor(leagueConfig) {
  const [predictor, setPredictor] = useState(null);
  const [status, setStatus] = useState({
    loading: true, eloLoaded: false, formLoaded: false, disabled: false, error: null,
  });

  // 호스트 팀 ID Set (leagueConfig는 모듈 스코프 상수 → 사실상 1회만 계산)
  const hostTeamIds = useMemo(() => {
    const ids = new Set();
    Object.values(leagueConfig?.groups ?? {}).forEach((group) => {
      (group.teams ?? []).forEach((t) => { if (t.host) ids.add(t.id); });
    });
    return ids;
  }, [leagueConfig]);

  useEffect(() => {
    // ?predictor=off URL flag — baseline 강제
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('predictor') === 'off') {
      console.log('[usePredictor] disabled via ?predictor=off');
      setStatus({ loading: false, eloLoaded: false, formLoaded: false, disabled: true, error: null });
      return;
    }

    let cancelled = false;

    async function loadPredictor() {
      const [eloRes, formRes] = await Promise.allSettled([
        fetch(`${API_BASE}/elo`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/team-form`).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (cancelled) return;

      const eloPayload = eloRes.status === 'fulfilled' && eloRes.value?.success ? eloRes.value : null;
      const formPayload = formRes.status === 'fulfilled' && formRes.value?.success ? formRes.value : null;

      const eloData = eloPayload?.data ?? null;
      const formData = formPayload?.data ?? null;

      // ELO 없으면 예측 불가 (폼만으로는 의미 없음) → baseline fallback
      if (!eloData || Object.keys(eloData).length === 0) {
        console.warn('[usePredictor] ELO 데이터 없음 — baseline fallback');
        setStatus({
          loading: false, eloLoaded: false, formLoaded: !!formData, disabled: false,
          error: 'no-elo',
        });
        return;
      }

      // API 응답 shape → matchPredictor 기대 shape 매핑
      // eloData: { TEAM_ID: { elo, eloCode, rank } } → eloMap: { TEAM_ID: { elo, isHost } }
      const eloMap = {};
      Object.entries(eloData).forEach(([teamId, info]) => {
        eloMap[teamId] = {
          elo: info.elo,
          isHost: hostTeamIds.has(teamId),
        };
      });

      // formData: { TEAM_ID: { n, gfPerGame, gaPerGame, lastUpdated } } — 그대로 사용
      const formMap = formData ?? {};

      const predictorFn = buildPredictorFn(eloMap, formMap);

      // setState(setter)에 함수를 직접 넣으면 setter form으로 해석되므로 wrap 필수
      setPredictor(() => predictorFn);
      setStatus({
        loading: false,
        eloLoaded: true,
        formLoaded: !!formData,
        disabled: false,
        error: null,
      });
      console.log(
        `[usePredictor] 활성화 — ELO ${Object.keys(eloMap).length}팀, ` +
        `폼 ${formData ? Object.keys(formData).length : 0}팀, 호스트 ${hostTeamIds.size}팀`
      );
    }

    loadPredictor().catch((err) => {
      if (cancelled) return;
      console.warn('[usePredictor] 로드 실패 — baseline fallback:', err.message);
      setStatus({
        loading: false, eloLoaded: false, formLoaded: false, disabled: false,
        error: err.message,
      });
    });

    return () => { cancelled = true; };
  }, [hostTeamIds]);

  return { predictor, status };
}
