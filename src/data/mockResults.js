/**
 * 테스트용 가상 경기 결과 — 각 팀 2경기 완료 기준
 *
 * 설계 조건:
 *   - 무승부 25% (12/48)
 *   - 업셋(하위팀 승) ~17% (6/36 결정적 경기)
 *   - 상위팀 우세하되 박빙 스코어 유지
 *
 * 업셋 6건:
 *   QAT(51위) beats CAN(27위)     — Group B
 *   CIV(42위) beats ECU(23위)     — Group E
 *   NZL(85위) beats EGY(34위)     — Group G
 *   SAU(60위) beats URU(16위)     — Group H  (2022 재현)
 *   NOR(29위) beats SEN(19위)     — Group I
 *   UZB(50위) beats COL(13위)     — Group K
 */
export const MOCK_RESULTS = {

  // ── Group A: MEX(0) KOR(1) RSA(2) UEFA_PO_D(3) ──────
  MEX_vs_RSA:       { home: 2, away: 1 },   // MEX wins
  KOR_vs_UEFA_PO_D: { home: 2, away: 0 },   // KOR wins
  MEX_vs_KOR:       { home: 1, away: 1 },   // draw — KOR holds Mexico
  RSA_vs_UEFA_PO_D: { home: 0, away: 0 },   // draw

  // ── Group B: CAN(0) CHE(1) QAT(2) UEFA_PO_A(3) ──────
  CAN_vs_UEFA_PO_A: { home: 3, away: 1 },   // CAN wins
  CHE_vs_QAT:       { home: 2, away: 0 },   // CHE wins
  CHE_vs_UEFA_PO_A: { home: 2, away: 1 },   // CHE wins
  CAN_vs_QAT:       { home: 0, away: 1 },   // UPSET: QAT beats CAN

  // ── Group C: BRA(0) MAR(1) SCO(2) HTI(3) ────────────
  BRA_vs_MAR:       { home: 1, away: 1 },   // draw — Morocco holds Brazil!
  SCO_vs_HTI:       { home: 2, away: 0 },   // SCO wins
  MAR_vs_SCO:       { home: 1, away: 0 },   // MAR wins
  BRA_vs_HTI:       { home: 4, away: 0 },   // BRA dominant

  // ── Group D: USA(0) AUS(1) PAR(2) UEFA_PO_C(3) ──────
  USA_vs_PAR:       { home: 2, away: 0 },   // USA wins
  AUS_vs_UEFA_PO_C: { home: 1, away: 1 },   // draw — playoff team holds Australia
  USA_vs_AUS:       { home: 2, away: 2 },   // draw — Australia battles USA
  PAR_vs_UEFA_PO_C: { home: 1, away: 0 },   // PAR wins

  // ── Group E: GER(0) ECU(1) CIV(2) CUW(3) ────────────
  GER_vs_CUW:       { home: 5, away: 0 },   // GER demolishes minnow
  ECU_vs_CIV:       { home: 0, away: 1 },   // UPSET: CIV beats ECU
  GER_vs_CIV:       { home: 2, away: 0 },   // GER wins
  ECU_vs_CUW:       { home: 3, away: 0 },   // ECU bounces back

  // ── Group F: NED(0) JPN(1) TUN(2) UEFA_PO_B(3) ──────
  NED_vs_UEFA_PO_B: { home: 3, away: 0 },   // NED wins
  JPN_vs_TUN:       { home: 2, away: 0 },   // JPN wins
  NED_vs_JPN:       { home: 1, away: 1 },   // draw — Japan holds Netherlands!
  TUN_vs_UEFA_PO_B: { home: 1, away: 0 },   // TUN wins

  // ── Group G: BEL(0) IRN(1) EGY(2) NZL(3) ────────────
  BEL_vs_EGY:       { home: 2, away: 1 },   // BEL wins
  IRN_vs_NZL:       { home: 2, away: 0 },   // IRN wins
  BEL_vs_IRN:       { home: 0, away: 0 },   // draw — tactical stalemate
  EGY_vs_NZL:       { home: 0, away: 1 },   // UPSET: NZL beats EGY

  // ── Group H: ESP(0) URU(1) SAU(2) CPV(3) ────────────
  ESP_vs_CPV:       { home: 3, away: 0 },   // ESP wins
  URU_vs_SAU:       { home: 0, away: 1 },   // UPSET: SAU beats URU (2022 재현!)
  ESP_vs_SAU:       { home: 1, away: 1 },   // draw — Saudi holds Spain!
  URU_vs_CPV:       { home: 3, away: 0 },   // URU bounces back

  // ── Group I: FRA(0) SEN(1) NOR(2) IC_PO_2(3) ────────
  FRA_vs_SEN:       { home: 1, away: 1 },   // draw — Senegal holds France!
  NOR_vs_IC_PO_2:   { home: 2, away: 0 },   // NOR wins
  SEN_vs_NOR:       { home: 1, away: 2 },   // UPSET: NOR beats SEN
  FRA_vs_IC_PO_2:   { home: 4, away: 0 },   // FRA dominant

  // ── Group J: ARG(0) AUT(1) ALG(2) JOR(3) ────────────
  ARG_vs_ALG:       { home: 2, away: 0 },   // ARG wins
  AUT_vs_JOR:       { home: 2, away: 1 },   // AUT wins
  ARG_vs_AUT:       { home: 1, away: 0 },   // ARG wins (tight)
  ALG_vs_JOR:       { home: 1, away: 1 },   // draw

  // ── Group K: POR(0) COL(1) UZB(2) IC_PO_1(3) ────────
  POR_vs_IC_PO_1:   { home: 3, away: 0 },   // POR wins
  COL_vs_UZB:       { home: 0, away: 1 },   // UPSET: UZB beats COL!
  POR_vs_COL:       { home: 1, away: 1 },   // draw — COL holds POR after upset loss
  UZB_vs_IC_PO_1:   { home: 2, away: 0 },   // UZB wins

  // ── Group L: ENG(0) CRO(1) GHA(2) PAN(3) ────────────
  GHA_vs_PAN:       { home: 1, away: 2 },   // PAN wins
  ENG_vs_CRO:       { home: 1, away: 1 },   // draw — classic European clash
  ENG_vs_GHA:       { home: 3, away: 0 },   // ENG wins
  CRO_vs_PAN:       { home: 2, away: 0 },   // CRO wins
};
