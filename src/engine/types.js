/**
 * 리그 엔진 타입 정의 (JSDoc)
 *
 * @typedef {Object} LeagueConfig
 * @property {string} id                        - 리그 식별자 (e.g. 'worldcup2026')
 * @property {string} name                      - 리그 이름 (e.g. '2026 FIFA World Cup')
 * @property {number} groupCount                - 조 수 (e.g. 12)
 * @property {number} teamsPerGroup             - 조당 팀 수 (e.g. 4)
 * @property {number} advancementSlots          - 조별 직접 진출 수 (e.g. 2)
 * @property {number|null} thirdPlaceAdvancing  - 3위 진출 팀 수 (null이면 3위 진출 없음)
 * @property {number|null} thirdPlaceMinPts     - 3위 진출 커트라인 승점 (시나리오 엔진용)
 * @property {FairPlayScorer} fairPlayScore     - 페어플레이 점수 계산 함수
 * @property {Array<TiebreakerFn>} tiebreakers  - h2h 이후 추가 타이브레이커 체인
 * @property {ConstraintChecker|null} drawConstraintChecker - 조추첨 제약조건 함수
 * @property {Object} groups                    - 조편성 데이터
 * @property {Object} matchSchedule             - 경기 일정 데이터 (id → { matchday, date, venue, city })
 * @property {Object} [rankings]                - 외부 랭킹 데이터
 * @property {Object} [seeds]                   - 시드 데이터
 * @property {Object} [drawPots]                - 조추첨 포트 데이터
 */

/**
 * @callback FairPlayScorer
 * @param {Object} team - 팀 객체 (yc, twoYR, dr 필드 포함)
 * @returns {number} 페어플레이 점수 (높을수록 유리)
 */

/**
 * @callback TiebreakerFn
 * @param {Object} a - 팀 A
 * @param {Object} b - 팀 B
 * @returns {number} 음수면 A 우선, 양수면 B 우선
 */

/**
 * @callback ConstraintChecker
 * @param {Object} group - 조 객체 ({ name, teams })
 * @param {Object} team  - 배정할 팀
 * @returns {boolean} 배정 가능하면 true
 */

export {};
