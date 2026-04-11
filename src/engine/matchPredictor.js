/**
 * ELO + 폼 기반 매치 승률 예측 모듈 (순수)
 *
 * 설계 원칙
 * - 데이터 소스(API, 캐시, D1)에 일절 의존하지 않음. 호출 측에서 ELO/폼 맵을 인자로 주입.
 * - 다른 디렉터리(leagues/, utils/, data/, server/, components/) import 금지.
 * - scenarioComputer.runBruteForce에 options.matchPredictor 콜백으로 주입되어
 *   매치별 Poisson λ를 결정 → 매치별 81셀(0~8골) 가중치 그리드 생성에 사용됨.
 *
 * 공식 (파라메트릭, 학습 없음)
 *   eloDiff   = home.elo − away.elo
 *   supremacy = eloDiff / SCALE + (isHost ? HFA_GOALS : 0)
 *   total     = BASE_TOTAL + FORM_WEIGHT * (homeFormDelta + awayFormDelta) / 2
 *   λHome     = clamp((total + supremacy) / 2, MIN_LAMBDA, MAX_LAMBDA)
 *   λAway     = clamp((total − supremacy) / 2, MIN_LAMBDA, MAX_LAMBDA)
 *
 * 좌표는 fixture의 home/away 그대로 (팀 상대 좌표 X).
 */

// ── 기본 계수 (문헌 디폴트, 단일 블록에서 튜닝 가능) ──────────────
export const DEFAULT_PREDICTOR_CONFIG = Object.freeze({
  HFA_GOALS: 0.30,    // 개최국 한정 home advantage (골 단위)
  SCALE: 180,         // 1골 supremacy 당 ELO 차이
  BASE_TOTAL: 2.50,   // 국제경기 평균 총득점
  FORM_WEIGHT: 0.25,  // 폼 (GF/N − GA/N) 가중치
  MIN_FORM_N: 5,      // 최근경기 < 5면 폼 항 0 처리
  MIN_LAMBDA: 0.15,
  MAX_LAMBDA: 4.50,
  MAX_GOALS: 8,       // PMF 길이 = MAX_GOALS + 1 (0~8골)
  DEFAULT_ELO: 1500,  // ELO 누락 시 fallback
});

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * 정규화된 Poisson PMF 배열 (0..max 골)
 * @param {number} lambda
 * @param {number} [max=8]
 * @returns {number[]} length = max + 1, 합 ≈ 1
 */
export function poissonWeights(lambda, max = 8) {
  const w = new Array(max + 1);
  let fact = 1;
  let sum = 0;
  for (let k = 0; k <= max; k++) {
    if (k > 0) fact *= k;
    const p = Math.exp(-lambda) * Math.pow(lambda, k) / fact;
    w[k] = p;
    sum += p;
  }
  // 잘림 보정 (꼬리 손실 흡수)
  if (sum > 0) for (let k = 0; k <= max; k++) w[k] /= sum;
  return w;
}

/**
 * 매치별 (λHome, λAway) 계산
 *
 * @param {object} home
 * @param {number} [home.elo]
 * @param {boolean} [home.isHost]
 * @param {{ n?: number, gfPerGame?: number, gaPerGame?: number }} [home.form]
 * @param {object} away
 * @param {number} [away.elo]
 * @param {{ n?: number, gfPerGame?: number, gaPerGame?: number }} [away.form]
 * @param {object} [cfg]
 * @returns {{ lambdaHome: number, lambdaAway: number }}
 */
export function predictMatchLambdas(home, away, cfg = DEFAULT_PREDICTOR_CONFIG) {
  const homeElo = home?.elo ?? cfg.DEFAULT_ELO;
  const awayElo = away?.elo ?? cfg.DEFAULT_ELO;

  const eloDiff = homeElo - awayElo;
  const hfa = home?.isHost ? cfg.HFA_GOALS : 0;
  const supremacy = eloDiff / cfg.SCALE + hfa;

  const hForm = formDelta(home?.form, cfg.MIN_FORM_N);
  const aForm = formDelta(away?.form, cfg.MIN_FORM_N);
  const total = cfg.BASE_TOTAL + cfg.FORM_WEIGHT * (hForm + aForm) / 2;

  const lambdaHome = clamp((total + supremacy) / 2, cfg.MIN_LAMBDA, cfg.MAX_LAMBDA);
  const lambdaAway = clamp((total - supremacy) / 2, cfg.MIN_LAMBDA, cfg.MAX_LAMBDA);

  return { lambdaHome, lambdaAway };
}

function formDelta(form, minN) {
  if (!form || (form.n ?? 0) < minN) return 0;
  return (form.gfPerGame ?? 0) - (form.gaPerGame ?? 0);
}

/**
 * scenarioComputer.runBruteForce에 주입할 predictor 함수 빌더
 *
 * @param {Record<string, { elo?: number, isHost?: boolean }>} eloMap
 *        팀 ID → ELO 정보. 없는 팀은 cfg.DEFAULT_ELO로 처리됨.
 * @param {Record<string, { n?: number, gfPerGame?: number, gaPerGame?: number }>} formMap
 *        팀 ID → 최근 폼. 없거나 n<MIN_FORM_N이면 폼 항 무시.
 * @param {object} [cfg]
 * @returns {(homeId: string, awayId: string) => {
 *   lambdaHome: number,
 *   lambdaAway: number,
 *   homeWeights: number[],
 *   awayWeights: number[],
 * } | null}
 *   양 팀 모두 ELO 데이터가 없으면 null 반환 → 호출 측 baseline fallback.
 */
export function buildPredictorFn(eloMap = {}, formMap = {}, cfg = DEFAULT_PREDICTOR_CONFIG) {
  return function matchPredictor(homeId, awayId) {
    const homeEntry = eloMap[homeId];
    const awayEntry = eloMap[awayId];

    // 양쪽 모두 ELO 없음 → 예측 불가, baseline 사용
    if (!homeEntry && !awayEntry) return null;

    const home = {
      elo: homeEntry?.elo,
      isHost: homeEntry?.isHost,
      form: formMap[homeId],
    };
    const away = {
      elo: awayEntry?.elo,
      form: formMap[awayId],
    };

    const { lambdaHome, lambdaAway } = predictMatchLambdas(home, away, cfg);
    return {
      lambdaHome,
      lambdaAway,
      homeWeights: poissonWeights(lambdaHome, cfg.MAX_GOALS),
      awayWeights: poissonWeights(lambdaAway, cfg.MAX_GOALS),
    };
  };
}
