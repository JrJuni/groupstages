/**
 * Stale 캐시 자동 갱신 헬퍼 팩토리
 *
 * 각 캐시 서비스(elo, form)에서 동일한 백그라운드 갱신 패턴을 공유.
 * - 캐시 나이가 maxAgeHours 초과 시 fire-and-forget refresh 트리거
 * - 모듈 인스턴스별 in-flight Promise 캐시로 동시 갱신 방지
 * - 일일 제한 (canFetchToday) 자동 존중
 *
 * 사용 예:
 *   // eloService.js
 *   import { createStaleRefresher } from './_staleRefresh.js';
 *   export const refreshIfStale = createStaleRefresher(getCacheStatus, 'ELO');
 *
 *   // 호출 측 (server/index.js GET handler)
 *   refreshIfStale({ maxAgeHours: 24, refreshFn: () => refreshElo() }).catch(() => {});
 *
 * @param {() => Promise<{ ageSeconds: number | null, canFetchToday: boolean }>} getCacheStatusFn
 *   해당 서비스의 캐시 상태 조회 함수 (eloService/teamFormService 의 getCacheStatus)
 * @param {string} [label='cache']  로그 prefix
 * @returns {(opts: { maxAgeHours: number, refreshFn: () => Promise<any> })
 *   => Promise<{ triggered: boolean, ageHours: number | null, reason: string }>}
 */
export function createStaleRefresher(getCacheStatusFn, label = 'cache') {
  // 인스턴스별 in-flight 보호 (closure 변수)
  let inflightRefresh = null;

  return async function refreshIfStale({ maxAgeHours, refreshFn }) {
    const status = await getCacheStatusFn();
    const ageHours = status.ageSeconds != null ? status.ageSeconds / 3600 : null;
    const isStale = ageHours == null || ageHours > maxAgeHours;

    if (!isStale) {
      return { triggered: false, ageHours, reason: 'fresh' };
    }
    if (!status.canFetchToday) {
      return { triggered: false, ageHours, reason: 'rate-limit' };
    }
    if (inflightRefresh) {
      return { triggered: false, ageHours, reason: 'inflight' };
    }

    const ageStr = ageHours == null ? 'none' : `${ageHours.toFixed(1)}h`;
    console.log(`[${label}] stale 캐시 감지 → 백그라운드 갱신 트리거 (age=${ageStr}, max=${maxAgeHours}h)`);

    inflightRefresh = Promise.resolve()
      .then(() => refreshFn())
      .then(() => {
        console.log(`[${label}] 백그라운드 갱신 완료`);
      })
      .catch((err) => {
        console.error(`[${label}] 백그라운드 갱신 실패:`, err.message);
      })
      .finally(() => {
        inflightRefresh = null;
      });

    return { triggered: true, ageHours, reason: 'stale' };
  };
}
