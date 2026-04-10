/**
 * 테스트용 가상 경기 결과
 *
 * MD1+MD2: 전 조 완료 (48경기)
 * MD3: A~F조 완료, G~L조 미완료 (12/24경기)
 *
 * 업셋 6건 (MD1+MD2):
 *   QAT beats CAN (B), CIV beats ECU (E), NZL beats EGY (G),
 *   SAU beats URU (H), NOR beats SEN (I), UZB beats COL (K)
 */
export const MOCK_RESULTS = {

  // ── Group A: MEX(0) KOR(1) RSA(2) CZE(3) ──────
  MEX_vs_RSA:       { home: 2, away: 1 },   // MEX wins
  KOR_vs_CZE:       { home: 2, away: 0 },   // KOR wins
  CZE_vs_RSA:       { home: 0, away: 0 },   // draw
  MEX_vs_KOR:       { home: 1, away: 1 },   // draw — KOR holds Mexico
  // MD3
  CZE_vs_MEX:       { home: 0, away: 2 },   // MEX wins — 1위 확정 (7pts)
  RSA_vs_KOR:       { home: 1, away: 3 },   // KOR wins — 2위 확정 (7pts)

  // ── Group B: CAN(0) CHE(1) QAT(2) BIH(3) ──────
  CAN_vs_BIH:       { home: 3, away: 1 },   // CAN wins
  QAT_vs_CHE:       { home: 0, away: 2 },   // CHE wins
  CHE_vs_BIH:       { home: 2, away: 1 },   // CHE wins
  CAN_vs_QAT:       { home: 0, away: 1 },   // UPSET: QAT beats CAN
  // MD3
  CHE_vs_CAN:       { home: 2, away: 1 },   // CHE wins — 1위 확정 (9pts)
  BIH_vs_QAT:       { home: 1, away: 2 },   // QAT wins — 카타르 역전 2위 (6pts)

  // ── Group C: BRA(0) MAR(1) SCO(2) HTI(3) ────────────
  BRA_vs_MAR:       { home: 1, away: 1 },   // draw — Morocco holds Brazil!
  HTI_vs_SCO:       { home: 0, away: 2 },   // SCO wins
  SCO_vs_MAR:       { home: 0, away: 1 },   // MAR wins
  BRA_vs_HTI:       { home: 4, away: 0 },   // BRA dominant
  // MD3
  SCO_vs_BRA:       { home: 1, away: 2 },   // BRA wins — 1위 (7pts)
  MAR_vs_HTI:       { home: 3, away: 0 },   // MAR wins — 2위 (7pts, GD로 BRA 1위)

  // ── Group D: USA(0) AUS(1) PAR(2) TUR(3) ──────
  USA_vs_PAR:       { home: 2, away: 0 },   // USA wins
  AUS_vs_TUR:       { home: 1, away: 1 },   // draw
  USA_vs_AUS:       { home: 2, away: 2 },   // draw — Australia battles USA
  TUR_vs_PAR:       { home: 0, away: 1 },   // PAR wins
  // MD3
  TUR_vs_USA:       { home: 1, away: 3 },   // USA wins — 1위 확정 (7pts)
  PAR_vs_AUS:       { home: 1, away: 1 },   // draw — PAR 2위 (4pts), AUS 3위 (3pts)

  // ── Group E: GER(0) ECU(1) CIV(2) CUW(3) ────────────
  GER_vs_CUW:       { home: 5, away: 0 },   // GER demolishes minnow
  CIV_vs_ECU:       { home: 1, away: 0 },   // UPSET: CIV beats ECU
  GER_vs_CIV:       { home: 2, away: 0 },   // GER wins
  ECU_vs_CUW:       { home: 3, away: 0 },   // ECU bounces back
  // MD3
  ECU_vs_GER:       { home: 1, away: 1 },   // draw — GER 1위 (7pts), ECU 2위 (4pts)
  CUW_vs_CIV:       { home: 0, away: 4 },   // CIV wins — 3위 (6pts) 3위 진출 유력

  // ── Group F: NED(0) JPN(1) TUN(2) SWE(3) ──────
  NED_vs_JPN:       { home: 1, away: 1 },   // draw — Japan holds Netherlands!
  SWE_vs_TUN:       { home: 0, away: 1 },   // TUN wins
  NED_vs_SWE:       { home: 3, away: 0 },   // NED wins
  TUN_vs_JPN:       { home: 0, away: 2 },   // JPN wins
  // MD3
  TUN_vs_NED:       { home: 0, away: 2 },   // NED wins — 1위 (7pts)
  JPN_vs_SWE:       { home: 1, away: 0 },   // JPN wins — 2위 (7pts, GD로 NED 1위)

  // ── Group G: BEL(0) IRN(1) EGY(2) NZL(3) ────────────
  BEL_vs_EGY:       { home: 2, away: 1 },   // BEL wins
  IRN_vs_NZL:       { home: 2, away: 0 },   // IRN wins
  BEL_vs_IRN:       { home: 0, away: 0 },   // draw — tactical stalemate
  NZL_vs_EGY:       { home: 1, away: 0 },   // UPSET: NZL beats EGY

  // ── Group H: ESP(0) URU(1) SAU(2) CPV(3) ────────────
  ESP_vs_CPV:       { home: 3, away: 0 },   // ESP wins
  SAU_vs_URU:       { home: 1, away: 0 },   // UPSET: SAU beats URU (2022 재현!)
  ESP_vs_SAU:       { home: 1, away: 1 },   // draw — Saudi holds Spain!
  URU_vs_CPV:       { home: 3, away: 0 },   // URU bounces back

  // ── Group I: FRA(0) SEN(1) NOR(2) IRQ(3) ────────
  FRA_vs_SEN:       { home: 1, away: 1 },   // draw — Senegal holds France!
  IRQ_vs_NOR:       { home: 0, away: 2 },   // NOR wins
  FRA_vs_IRQ:       { home: 4, away: 0 },   // FRA dominant
  NOR_vs_SEN:       { home: 2, away: 1 },   // UPSET: NOR beats SEN

  // ── Group J: ARG(0) AUT(1) ALG(2) JOR(3) ────────────
  ARG_vs_ALG:       { home: 2, away: 0 },   // ARG wins
  AUT_vs_JOR:       { home: 2, away: 1 },   // AUT wins
  ARG_vs_AUT:       { home: 1, away: 0 },   // ARG wins (tight)
  JOR_vs_ALG:       { home: 1, away: 1 },   // draw

  // ── Group K: POR(0) COL(1) UZB(2) COD(3) ────────
  POR_vs_COD:       { home: 3, away: 0 },   // POR wins
  UZB_vs_COL:       { home: 1, away: 0 },   // UPSET: UZB beats COL!
  POR_vs_UZB:       { home: 1, away: 1 },   // draw — POR after upset loss
  COL_vs_COD:       { home: 2, away: 0 },   // COL wins

  // ── Group L: ENG(0) CRO(1) GHA(2) PAN(3) ────────────
  ENG_vs_CRO:       { home: 1, away: 1 },   // draw — classic European clash
  GHA_vs_PAN:       { home: 1, away: 2 },   // PAN wins
  ENG_vs_GHA:       { home: 3, away: 0 },   // ENG wins
  PAN_vs_CRO:       { home: 0, away: 2 },   // CRO wins
};
