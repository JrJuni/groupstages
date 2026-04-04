export const CONFEDERATIONS = {
  UEFA: { name: 'UEFA', color: '#003399', bg: '#e8f0ff' },
  CAF: { name: 'CAF', color: '#009900', bg: '#e8ffe8' },
  CONMEBOL: { name: 'CONMEBOL', color: '#ffcc00', bg: '#fffbe8' },
  AFC: { name: 'AFC', color: '#cc0000', bg: '#ffe8e8' },
  CONCACAF: { name: 'CONCACAF', color: '#ff6600', bg: '#fff0e8' },
  OFC: { name: 'OFC', color: '#6600cc', bg: '#f0e8ff' },
};

// 2026 FIFA World Cup - 48 teams across 12 groups
// 실제 2025년 12월 5일 조추첨 결과 (케네디 센터, 워싱턴 D.C.)
// flagImg: flags/{iso2}.png 경로 (BASE_URL과 결합), 미확정 팀은 flag 이모지만 사용
export const INITIAL_GROUPS = {
  A: {
    teams: [
      { id: 'MEX', name: '멕시코', flag: '🇲🇽', flagImg: 'flags/mx.png', confederation: 'CONCACAF', host: true, yc: 0, twoYR: 0, dr: 0 },
      { id: 'KOR', name: '대한민국', flag: '🇰🇷', flagImg: 'flags/kr.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'RSA', name: '남아프리카공화국', flag: '🇿🇦', flagImg: 'flags/za.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'CZE', name: '체코', flag: '🇨🇿', flagImg: 'flags/cz.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  B: {
    teams: [
      { id: 'CAN', name: '캐나다', flag: '🇨🇦', flagImg: 'flags/ca.png', confederation: 'CONCACAF', host: true, yc: 0, twoYR: 0, dr: 0 },
      { id: 'CHE', name: '스위스', flag: '🇨🇭', flagImg: 'flags/ch.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'QAT', name: '카타르', flag: '🇶🇦', flagImg: 'flags/qa.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'BIH', name: '보스니아', flag: '🇧🇦', flagImg: 'flags/ba.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  C: {
    teams: [
      { id: 'BRA', name: '브라질', flag: '🇧🇷', flagImg: 'flags/br.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'MAR', name: '모로코', flag: '🇲🇦', flagImg: 'flags/ma.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'SCO', name: '스코틀랜드', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagImg: 'flags/gb-sct.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'HTI', name: '아이티', flag: '🇭🇹', flagImg: 'flags/ht.png', confederation: 'CONCACAF', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  D: {
    teams: [
      { id: 'USA', name: '미국', flag: '🇺🇸', flagImg: 'flags/us.png', confederation: 'CONCACAF', host: true, yc: 0, twoYR: 0, dr: 0 },
      { id: 'AUS', name: '호주', flag: '🇦🇺', flagImg: 'flags/au.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'PAR', name: '파라과이', flag: '🇵🇾', flagImg: 'flags/py.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'TUR', name: '튀르키예', flag: '🇹🇷', flagImg: 'flags/tr.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  E: {
    teams: [
      { id: 'GER', name: '독일', flag: '🇩🇪', flagImg: 'flags/de.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'ECU', name: '에콰도르', flag: '🇪🇨', flagImg: 'flags/ec.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'CIV', name: '코트디부아르', flag: '🇨🇮', flagImg: 'flags/ci.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'CUW', name: '퀴라소', flag: '🇨🇼', flagImg: 'flags/cw.png', confederation: 'CONCACAF', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  F: {
    teams: [
      { id: 'NED', name: '네덜란드', flag: '🇳🇱', flagImg: 'flags/nl.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'JPN', name: '일본', flag: '🇯🇵', flagImg: 'flags/jp.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'TUN', name: '튀니지', flag: '🇹🇳', flagImg: 'flags/tn.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'SWE', name: '스웨덴', flag: '🇸🇪', flagImg: 'flags/se.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  G: {
    teams: [
      { id: 'BEL', name: '벨기에', flag: '🇧🇪', flagImg: 'flags/be.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'IRN', name: '이란', flag: '🇮🇷', flagImg: 'flags/ir.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'EGY', name: '이집트', flag: '🇪🇬', flagImg: 'flags/eg.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'NZL', name: '뉴질랜드', flag: '🇳🇿', flagImg: 'flags/nz.png', confederation: 'OFC', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  H: {
    teams: [
      { id: 'ESP', name: '스페인', flag: '🇪🇸', flagImg: 'flags/es.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'URU', name: '우루과이', flag: '🇺🇾', flagImg: 'flags/uy.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'SAU', name: '사우디아라비아', flag: '🇸🇦', flagImg: 'flags/sa.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'CPV', name: '카보베르데', flag: '🇨🇻', flagImg: 'flags/cv.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  I: {
    teams: [
      { id: 'FRA', name: '프랑스', flag: '🇫🇷', flagImg: 'flags/fr.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'SEN', name: '세네갈', flag: '🇸🇳', flagImg: 'flags/sn.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'NOR', name: '노르웨이', flag: '🇳🇴', flagImg: 'flags/no.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'IRQ', name: '이라크', flag: '🇮🇶', flagImg: 'flags/iq.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  J: {
    teams: [
      { id: 'ARG', name: '아르헨티나', flag: '🇦🇷', flagImg: 'flags/ar.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'AUT', name: '오스트리아', flag: '🇦🇹', flagImg: 'flags/at.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'ALG', name: '알제리', flag: '🇩🇿', flagImg: 'flags/dz.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'JOR', name: '요르단', flag: '🇯🇴', flagImg: 'flags/jo.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  K: {
    teams: [
      { id: 'POR', name: '포르투갈', flag: '🇵🇹', flagImg: 'flags/pt.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'COL', name: '콜롬비아', flag: '🇨🇴', flagImg: 'flags/co.png', confederation: 'CONMEBOL', yc: 0, twoYR: 0, dr: 0 },
      { id: 'UZB', name: '우즈베키스탄', flag: '🇺🇿', flagImg: 'flags/uz.png', confederation: 'AFC', yc: 0, twoYR: 0, dr: 0 },
      { id: 'COD', name: 'DR 콩고', flag: '🇨🇩', flagImg: 'flags/cd.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
  L: {
    teams: [
      { id: 'ENG', name: '잉글랜드', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagImg: 'flags/gb-eng.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'CRO', name: '크로아티아', flag: '🇭🇷', flagImg: 'flags/hr.png', confederation: 'UEFA', yc: 0, twoYR: 0, dr: 0 },
      { id: 'GHA', name: '가나', flag: '🇬🇭', flagImg: 'flags/gh.png', confederation: 'CAF', yc: 0, twoYR: 0, dr: 0 },
      { id: 'PAN', name: '파나마', flag: '🇵🇦', flagImg: 'flags/pa.png', confederation: 'CONCACAF', yc: 0, twoYR: 0, dr: 0 },
    ],
  },
};

export const THIRD_PLACE_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// ── 토너먼트 대진표 (FIFA 공식 기준, 2025년 12월 확정) ───────────
// R32: 8경기 1위 vs 3위, 4경기 1위/2위 교차, 4경기 2위 vs 2위
// 3위 슬롯: thirdFrom = 해당 슬롯에 배정 가능한 그룹 목록
export const KNOCKOUT_BRACKET = [
  // ── R32 (16경기) ──────────────────────────────
  // Left bracket (8경기)
  { id: 'M74', round: 'R32', side: 'left', pos: 0, team1: '1E', team2: '3rd', thirdFrom: ['A','B','C','D','F'], next: 'M89' },
  { id: 'M77', round: 'R32', side: 'left', pos: 1, team1: '1I', team2: '3rd', thirdFrom: ['C','D','F','G','H'], next: 'M89' },
  { id: 'M73', round: 'R32', side: 'left', pos: 2, team1: '2A', team2: '2B', next: 'M90' },
  { id: 'M75', round: 'R32', side: 'left', pos: 3, team1: '1F', team2: '2C', next: 'M90' },
  { id: 'M83', round: 'R32', side: 'left', pos: 4, team1: '2K', team2: '2L', next: 'M93' },
  { id: 'M84', round: 'R32', side: 'left', pos: 5, team1: '1H', team2: '2J', next: 'M93' },
  { id: 'M81', round: 'R32', side: 'left', pos: 6, team1: '1D', team2: '3rd', thirdFrom: ['B','E','F','I','J'], next: 'M94' },
  { id: 'M82', round: 'R32', side: 'left', pos: 7, team1: '1G', team2: '3rd', thirdFrom: ['A','E','H','I','J'], next: 'M94' },
  // Right bracket (8경기)
  { id: 'M76', round: 'R32', side: 'right', pos: 0, team1: '1C', team2: '2F', next: 'M91' },
  { id: 'M78', round: 'R32', side: 'right', pos: 1, team1: '2E', team2: '2I', next: 'M91' },
  { id: 'M79', round: 'R32', side: 'right', pos: 2, team1: '1A', team2: '3rd', thirdFrom: ['C','E','F','H','I'], next: 'M92' },
  { id: 'M80', round: 'R32', side: 'right', pos: 3, team1: '1L', team2: '3rd', thirdFrom: ['E','H','I','J','K'], next: 'M92' },
  { id: 'M86', round: 'R32', side: 'right', pos: 4, team1: '1J', team2: '2H', next: 'M95' },
  { id: 'M88', round: 'R32', side: 'right', pos: 5, team1: '2D', team2: '2G', next: 'M95' },
  { id: 'M85', round: 'R32', side: 'right', pos: 6, team1: '1B', team2: '3rd', thirdFrom: ['E','F','G','I','J'], next: 'M96' },
  { id: 'M87', round: 'R32', side: 'right', pos: 7, team1: '1K', team2: '3rd', thirdFrom: ['D','E','I','J','L'], next: 'M96' },
  // ── R16 (8경기) ──────────────────────────────
  { id: 'M89', round: 'R16', side: 'left',  pos: 0, from: ['M74','M77'], next: 'M97' },
  { id: 'M90', round: 'R16', side: 'left',  pos: 1, from: ['M73','M75'], next: 'M97' },
  { id: 'M93', round: 'R16', side: 'left',  pos: 2, from: ['M83','M84'], next: 'M98' },
  { id: 'M94', round: 'R16', side: 'left',  pos: 3, from: ['M81','M82'], next: 'M98' },
  { id: 'M91', round: 'R16', side: 'right', pos: 0, from: ['M76','M78'], next: 'M99' },
  { id: 'M92', round: 'R16', side: 'right', pos: 1, from: ['M79','M80'], next: 'M99' },
  { id: 'M95', round: 'R16', side: 'right', pos: 2, from: ['M86','M88'], next: 'M100' },
  { id: 'M96', round: 'R16', side: 'right', pos: 3, from: ['M85','M87'], next: 'M100' },
  // ── QF (4경기) ──────────────────────────────
  { id: 'M97',  round: 'QF', side: 'left',  pos: 0, from: ['M89','M90'], next: 'M101' },
  { id: 'M98',  round: 'QF', side: 'left',  pos: 1, from: ['M93','M94'], next: 'M101' },
  { id: 'M99',  round: 'QF', side: 'right', pos: 0, from: ['M91','M92'], next: 'M102' },
  { id: 'M100', round: 'QF', side: 'right', pos: 1, from: ['M95','M96'], next: 'M102' },
  // ── SF (2경기) ──────────────────────────────
  { id: 'M101', round: 'SF', side: 'left',  pos: 0, from: ['M97','M98'],  next: 'FINAL' },
  { id: 'M102', round: 'SF', side: 'right', pos: 0, from: ['M99','M100'], next: 'FINAL' },
  // ── Final ──────────────────────────────────
  { id: 'FINAL', round: 'FINAL', side: 'center', pos: 0, from: ['M101','M102'] },
];

// 실제 2026 WC 조추첨 Pot 시스템
// (2025년 12월 5일 케네디 센터 추첨 기준 / 포트 배정: 2025년 11월 19일 FIFA 랭킹)
export const DRAW_POTS = {
  pot1: [
    { id: 'USA', name: '미국', flag: '🇺🇸', flagImg: 'flags/us.png', confederation: 'CONCACAF', host: true },
    { id: 'MEX', name: '멕시코', flag: '🇲🇽', flagImg: 'flags/mx.png', confederation: 'CONCACAF', host: true },
    { id: 'CAN', name: '캐나다', flag: '🇨🇦', flagImg: 'flags/ca.png', confederation: 'CONCACAF', host: true },
    { id: 'ESP', name: '스페인', flag: '🇪🇸', flagImg: 'flags/es.png', confederation: 'UEFA' },
    { id: 'ARG', name: '아르헨티나', flag: '🇦🇷', flagImg: 'flags/ar.png', confederation: 'CONMEBOL' },
    { id: 'FRA', name: '프랑스', flag: '🇫🇷', flagImg: 'flags/fr.png', confederation: 'UEFA' },
    { id: 'ENG', name: '잉글랜드', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagImg: 'flags/gb-eng.png', confederation: 'UEFA' },
    { id: 'BRA', name: '브라질', flag: '🇧🇷', flagImg: 'flags/br.png', confederation: 'CONMEBOL' },
    { id: 'POR', name: '포르투갈', flag: '🇵🇹', flagImg: 'flags/pt.png', confederation: 'UEFA' },
    { id: 'NED', name: '네덜란드', flag: '🇳🇱', flagImg: 'flags/nl.png', confederation: 'UEFA' },
    { id: 'BEL', name: '벨기에', flag: '🇧🇪', flagImg: 'flags/be.png', confederation: 'UEFA' },
    { id: 'GER', name: '독일', flag: '🇩🇪', flagImg: 'flags/de.png', confederation: 'UEFA' },
  ],
  pot2: [
    { id: 'CRO', name: '크로아티아', flag: '🇭🇷', flagImg: 'flags/hr.png', confederation: 'UEFA' },
    { id: 'MAR', name: '모로코', flag: '🇲🇦', flagImg: 'flags/ma.png', confederation: 'CAF' },
    { id: 'COL', name: '콜롬비아', flag: '🇨🇴', flagImg: 'flags/co.png', confederation: 'CONMEBOL' },
    { id: 'URU', name: '우루과이', flag: '🇺🇾', flagImg: 'flags/uy.png', confederation: 'CONMEBOL' },
    { id: 'CHE', name: '스위스', flag: '🇨🇭', flagImg: 'flags/ch.png', confederation: 'UEFA' },
    { id: 'JPN', name: '일본', flag: '🇯🇵', flagImg: 'flags/jp.png', confederation: 'AFC' },
    { id: 'SEN', name: '세네갈', flag: '🇸🇳', flagImg: 'flags/sn.png', confederation: 'CAF' },
    { id: 'IRN', name: '이란', flag: '🇮🇷', flagImg: 'flags/ir.png', confederation: 'AFC' },
    { id: 'KOR', name: '대한민국', flag: '🇰🇷', flagImg: 'flags/kr.png', confederation: 'AFC' },
    { id: 'ECU', name: '에콰도르', flag: '🇪🇨', flagImg: 'flags/ec.png', confederation: 'CONMEBOL' },
    { id: 'AUT', name: '오스트리아', flag: '🇦🇹', flagImg: 'flags/at.png', confederation: 'UEFA' },
    { id: 'AUS', name: '호주', flag: '🇦🇺', flagImg: 'flags/au.png', confederation: 'AFC' },
  ],
  pot3: [
    { id: 'NOR', name: '노르웨이', flag: '🇳🇴', flagImg: 'flags/no.png', confederation: 'UEFA' },
    { id: 'PAN', name: '파나마', flag: '🇵🇦', flagImg: 'flags/pa.png', confederation: 'CONCACAF' },
    { id: 'EGY', name: '이집트', flag: '🇪🇬', flagImg: 'flags/eg.png', confederation: 'CAF' },
    { id: 'ALG', name: '알제리', flag: '🇩🇿', flagImg: 'flags/dz.png', confederation: 'CAF' },
    { id: 'SCO', name: '스코틀랜드', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagImg: 'flags/gb-sct.png', confederation: 'UEFA' },
    { id: 'PAR', name: '파라과이', flag: '🇵🇾', flagImg: 'flags/py.png', confederation: 'CONMEBOL' },
    { id: 'TUN', name: '튀니지', flag: '🇹🇳', flagImg: 'flags/tn.png', confederation: 'CAF' },
    { id: 'CIV', name: '코트디부아르', flag: '🇨🇮', flagImg: 'flags/ci.png', confederation: 'CAF' },
    { id: 'UZB', name: '우즈베키스탄', flag: '🇺🇿', flagImg: 'flags/uz.png', confederation: 'AFC' },
    { id: 'QAT', name: '카타르', flag: '🇶🇦', flagImg: 'flags/qa.png', confederation: 'AFC' },
    { id: 'SAU', name: '사우디아라비아', flag: '🇸🇦', flagImg: 'flags/sa.png', confederation: 'AFC' },
    { id: 'RSA', name: '남아프리카공화국', flag: '🇿🇦', flagImg: 'flags/za.png', confederation: 'CAF' },
  ],
  pot4: [
    { id: 'JOR', name: '요르단', flag: '🇯🇴', flagImg: 'flags/jo.png', confederation: 'AFC' },
    { id: 'CPV', name: '카보베르데', flag: '🇨🇻', flagImg: 'flags/cv.png', confederation: 'CAF' },
    { id: 'GHA', name: '가나', flag: '🇬🇭', flagImg: 'flags/gh.png', confederation: 'CAF' },
    { id: 'CUW', name: '퀴라소', flag: '🇨🇼', flagImg: 'flags/cw.png', confederation: 'CONCACAF' },
    { id: 'HTI', name: '아이티', flag: '🇭🇹', flagImg: 'flags/ht.png', confederation: 'CONCACAF' },
    { id: 'NZL', name: '뉴질랜드', flag: '🇳🇿', flagImg: 'flags/nz.png', confederation: 'OFC' },
    { id: 'BIH', name: '보스니아', flag: '🇧🇦', flagImg: 'flags/ba.png', confederation: 'UEFA' },
    { id: 'SWE', name: '스웨덴', flag: '🇸🇪', flagImg: 'flags/se.png', confederation: 'UEFA' },
    { id: 'TUR', name: '튀르키예', flag: '🇹🇷', flagImg: 'flags/tr.png', confederation: 'UEFA' },
    { id: 'CZE', name: '체코', flag: '🇨🇿', flagImg: 'flags/cz.png', confederation: 'UEFA' },
    { id: 'COD', name: 'DR 콩고', flag: '🇨🇩', flagImg: 'flags/cd.png', confederation: 'CAF' },
    { id: 'IRQ', name: '이라크', flag: '🇮🇶', flagImg: 'flags/iq.png', confederation: 'AFC' },
  ],
};

// ──────────────────────────────────────────────────────────────────
// 2026 FIFA World Cup 조별리그 공식 경기 일정
// 모든 시간 UTC 기준 (KST = UTC+9)
// 출처: FIFA 공식 대회 일정 (2024년 발표)
//
// API-Football (RapidAPI) 연동 시 fixture_id 필드를 통해 매핑됩니다.
// ──────────────────────────────────────────────────────────────────
export const MATCH_SCHEDULE = {
  // ── Group A (MEX · KOR · RSA · CZE) ────────────────────
  // R1: MEX vs RSA (Jun 11), KOR vs CZE (Jun 12)
  // R2: MEX vs KOR (Jun 18/19), RSA vs CZE (Jun 18)
  // R3: MEX vs CZE · KOR vs RSA (Jun 24/25 동시)
  'MEX_vs_RSA':         { matchday: 1, date: '2026-06-11T19:00:00Z', venue: 'Estadio Azteca',          city: 'Mexico City, MEX' },
  'KOR_vs_CZE':   { matchday: 1, date: '2026-06-12T16:00:00Z', venue: 'Estadio Guadalajara',     city: 'Guadalajara, MEX' },
  'MEX_vs_KOR':         { matchday: 2, date: '2026-06-19T01:00:00Z', venue: 'Estadio Guadalajara',     city: 'Guadalajara, MEX' },
  'RSA_vs_CZE':   { matchday: 2, date: '2026-06-18T22:00:00Z', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  'KOR_vs_RSA':         { matchday: 3, date: '2026-06-24T22:00:00Z', venue: 'NRG Stadium',             city: 'Houston, TX' },
  'MEX_vs_CZE':   { matchday: 3, date: '2026-06-25T01:00:00Z', venue: 'Estadio Azteca',          city: 'Mexico City, MEX' },

  // ── Group B (CAN · CHE · QAT · BIH) ────────────────────
  'CAN_vs_BIH':   { matchday: 1, date: '2026-06-12T19:00:00Z', venue: 'BMO Field',               city: 'Toronto, CAN' },
  'CHE_vs_QAT':         { matchday: 1, date: '2026-06-12T22:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'CHE_vs_BIH':   { matchday: 2, date: '2026-06-18T22:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },
  'CAN_vs_QAT':         { matchday: 2, date: '2026-06-19T01:00:00Z', venue: 'BC Place',                city: 'Vancouver, CAN' },
  'CAN_vs_CHE':         { matchday: 3, date: '2026-06-25T04:00:00Z', venue: 'BC Place',                city: 'Vancouver, CAN' },
  'QAT_vs_BIH':   { matchday: 3, date: '2026-06-25T04:00:00Z', venue: 'Lumen Field',             city: 'Seattle, WA' },

  // ── Group C (BRA · MAR · SCO · HTI) ──────────────────────────
  'BRA_vs_MAR':         { matchday: 1, date: '2026-06-13T22:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },
  'SCO_vs_HTI':         { matchday: 1, date: '2026-06-14T01:00:00Z', venue: 'Hard Rock Stadium',       city: 'Miami, FL' },
  'MAR_vs_SCO':         { matchday: 2, date: '2026-06-19T22:00:00Z', venue: 'Gillette Stadium',        city: 'Foxborough, MA' },
  'BRA_vs_HTI':         { matchday: 2, date: '2026-06-20T01:00:00Z', venue: 'Rose Bowl',               city: 'Pasadena, CA' },
  'BRA_vs_SCO':         { matchday: 3, date: '2026-06-24T22:00:00Z', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  'MAR_vs_HTI':         { matchday: 3, date: '2026-06-24T22:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia, PA' },

  // ── Group D (USA · AUS · PAR · TUR) ────────────────────
  'USA_vs_PAR':         { matchday: 1, date: '2026-06-13T01:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },
  'AUS_vs_TUR':   { matchday: 1, date: '2026-06-13T04:00:00Z', venue: 'BC Place',                city: 'Vancouver, CAN' },
  'USA_vs_AUS':         { matchday: 2, date: '2026-06-19T19:00:00Z', venue: 'Lumen Field',             city: 'Seattle, WA' },
  'PAR_vs_TUR':   { matchday: 2, date: '2026-06-19T04:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'AUS_vs_PAR':         { matchday: 3, date: '2026-06-26T02:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'USA_vs_TUR':   { matchday: 3, date: '2026-06-26T02:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },

  // ── Group E (GER · ECU · CIV · CUW) ──────────────────────────
  'GER_vs_CUW':         { matchday: 1, date: '2026-06-14T17:00:00Z', venue: 'BMO Field',               city: 'Toronto, CAN' },
  'ECU_vs_CIV':         { matchday: 1, date: '2026-06-14T23:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  'GER_vs_CIV':         { matchday: 2, date: '2026-06-20T20:00:00Z', venue: 'BMO Field',               city: 'Toronto, CAN' },
  'ECU_vs_CUW':         { matchday: 2, date: '2026-06-21T00:00:00Z', venue: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  'GER_vs_ECU':         { matchday: 3, date: '2026-06-25T20:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  'CIV_vs_CUW':         { matchday: 3, date: '2026-06-25T20:00:00Z', venue: 'Arrowhead Stadium',       city: 'Kansas City, MO' },

  // ── Group F (NED · JPN · TUN · SWE) ────────────────────
  'NED_vs_SWE':   { matchday: 1, date: '2026-06-14T16:00:00Z', venue: 'AT&T Stadium',            city: 'Arlington, TX' },
  'NED_vs_JPN':         { matchday: 1, date: '2026-06-14T20:00:00Z', venue: 'Estadio Akron',           city: 'Guadalajara, MEX' },
  'TUN_vs_SWE':   { matchday: 2, date: '2026-06-20T07:00:00Z', venue: 'Estadio Monterrey',       city: 'Monterrey, MEX' },
  'JPN_vs_TUN':         { matchday: 2, date: '2026-06-21T04:00:00Z', venue: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  'NED_vs_TUN':         { matchday: 3, date: '2026-06-25T23:00:00Z', venue: 'AT&T Stadium',            city: 'Arlington, TX' },
  'JPN_vs_SWE':   { matchday: 3, date: '2026-06-26T22:00:00Z', venue: 'Estadio Monterrey',       city: 'Monterrey, MEX' },

  // ── Group G (BEL · IRN · EGY · NZL) ──────────────────────────
  'BEL_vs_EGY':         { matchday: 1, date: '2026-06-15T19:00:00Z', venue: 'Lumen Field',             city: 'Seattle, WA' },
  'IRN_vs_NZL':         { matchday: 1, date: '2026-06-15T22:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },
  'BEL_vs_IRN':         { matchday: 2, date: '2026-06-21T19:00:00Z', venue: 'Lumen Field',             city: 'Seattle, WA' },
  'EGY_vs_NZL':         { matchday: 2, date: '2026-06-21T22:00:00Z', venue: 'SoFi Stadium',            city: 'Inglewood, CA' },
  'BEL_vs_NZL':         { matchday: 3, date: '2026-06-27T21:00:00Z', venue: 'Lumen Field',             city: 'Seattle, WA' },
  'IRN_vs_EGY':         { matchday: 3, date: '2026-06-27T21:00:00Z', venue: 'BC Place',                city: 'Vancouver, CAN' },

  // ── Group H (ESP · URU · SAU · CPV) ──────────────────────────
  'ESP_vs_CPV':         { matchday: 1, date: '2026-06-15T16:00:00Z', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  'URU_vs_SAU':         { matchday: 1, date: '2026-06-16T01:00:00Z', venue: 'Hard Rock Stadium',       city: 'Miami, FL' },
  'ESP_vs_SAU':         { matchday: 2, date: '2026-06-21T16:00:00Z', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },
  'URU_vs_CPV':         { matchday: 2, date: '2026-06-22T01:00:00Z', venue: 'Hard Rock Stadium',       city: 'Miami, FL' },
  'ESP_vs_URU':         { matchday: 3, date: '2026-06-27T19:00:00Z', venue: 'Hard Rock Stadium',       city: 'Miami, FL' },
  'SAU_vs_CPV':         { matchday: 3, date: '2026-06-27T19:00:00Z', venue: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA' },

  // ── Group I (FRA · SEN · NOR · IRQ) ──────────────────────
  'FRA_vs_SEN':         { matchday: 1, date: '2026-06-16T19:00:00Z', venue: 'MetLife Stadium',         city: 'East Rutherford, NJ' },
  'NOR_vs_IRQ':     { matchday: 1, date: '2026-06-16T19:00:00Z', venue: 'Gillette Stadium',        city: 'Foxborough, MA' },
  'SEN_vs_IRQ':     { matchday: 2, date: '2026-06-22T04:00:00Z', venue: 'BMO Field',               city: 'Toronto, CAN' },
  'SEN_vs_NOR':         { matchday: 2, date: '2026-06-23T00:00:00Z', venue: 'Gillette Stadium',        city: 'Foxborough, MA' },
  'FRA_vs_NOR':         { matchday: 3, date: '2026-06-26T19:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
  'FRA_vs_IRQ':     { matchday: 3, date: '2026-06-27T23:00:00Z', venue: 'MetLife Stadium',         city: 'East Rutherford, NJ' },

  // ── Group J (ARG · AUT · ALG · JOR) ──────────────────────────
  'ARG_vs_ALG':         { matchday: 1, date: '2026-06-16T22:00:00Z', venue: 'Arrowhead Stadium',       city: 'Kansas City, MO' },
  'AUT_vs_JOR':         { matchday: 1, date: '2026-06-17T01:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'ARG_vs_AUT':         { matchday: 2, date: '2026-06-22T22:00:00Z', venue: 'AT&T Stadium',            city: 'Arlington, TX' },
  'ALG_vs_JOR':         { matchday: 2, date: '2026-06-22T07:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'ARG_vs_JOR':         { matchday: 3, date: '2026-06-28T00:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'AUT_vs_ALG':         { matchday: 3, date: '2026-06-28T00:00:00Z', venue: 'AT&T Stadium',            city: 'Arlington, TX' },

  // ── Group K (POR · COL · UZB · COD) ──────────────────────
  'POR_vs_COD':     { matchday: 1, date: '2026-06-17T16:00:00Z', venue: 'NRG Stadium',             city: 'Houston, TX' },
  'COL_vs_UZB':         { matchday: 1, date: '2026-06-18T02:00:00Z', venue: "Levi's Stadium",          city: 'Santa Clara, CA' },
  'UZB_vs_COD':     { matchday: 2, date: '2026-06-23T04:00:00Z', venue: 'Estadio Guadalajara',     city: 'Guadalajara, MEX' },
  'POR_vs_UZB':         { matchday: 2, date: '2026-06-23T17:00:00Z', venue: 'NRG Stadium',             city: 'Houston, TX' },
  'COL_vs_COD':     { matchday: 3, date: '2026-06-27T02:00:00Z', venue: 'Estadio Guadalajara',     city: 'Guadalajara, MEX' },
  'POR_vs_COL':         { matchday: 3, date: '2026-06-27T23:30:00Z', venue: 'NRG Stadium',             city: 'Houston, TX' },

  // ── Group L (ENG · CRO · GHA · PAN) ──────────────────────────
  'GHA_vs_PAN':         { matchday: 1, date: '2026-06-17T22:00:00Z', venue: 'Gillette Stadium',        city: 'Foxborough, MA' },
  'ENG_vs_CRO':         { matchday: 1, date: '2026-06-18T01:00:00Z', venue: 'AT&T Stadium',            city: 'Arlington, TX' },
  'ENG_vs_GHA':         { matchday: 2, date: '2026-06-23T01:00:00Z', venue: 'Gillette Stadium',        city: 'Foxborough, MA' },
  'CRO_vs_PAN':         { matchday: 2, date: '2026-06-23T07:00:00Z', venue: 'BMO Field',               city: 'Toronto, CAN' },
  'ENG_vs_PAN':         { matchday: 3, date: '2026-06-27T21:00:00Z', venue: 'MetLife Stadium',         city: 'East Rutherford, NJ' },
  'CRO_vs_GHA':         { matchday: 3, date: '2026-06-27T21:00:00Z', venue: 'Lincoln Financial Field', city: 'Philadelphia, PA' },
};

// ──────────────────────────────────────────────────────────────────
// FIFA 공식 랭킹 - 고정값 (2025년 11월 기준 — 조추첨 기준점)
// 출처: FIFA 공식 랭킹 (2025년 11월 발표)
// 3위팀 상위 8팀 선별 타이브레이커 최종 기준으로 사용 (낮을수록 상위)
// 모든 48팀 확정 (2026년 3월 대륙간 플레이오프 완료)
// ⚠️ TODO: 실제 2025년 11월 랭킹으로 교체 필요
// ──────────────────────────────────────────────────────────────────
export const FIFA_RANKINGS_DRAW = {
  // ── Pot 1 (개최국 3팀 + FIFA 상위 9팀) ───────────────────────
  ESP:  1, ARG:  2, FRA:  3, ENG:  4, BRA:  5,
  POR:  6, NED:  7, BEL:  8, GER:  9,
  USA: 14, MEX: 15, CAN: 27,
  // ── Pot 2 ────────────────────────────────────────────────────
  CRO: 10, MAR: 11, COL: 13, URU: 16, CHE: 17,
  JPN: 18, SEN: 19, IRN: 20, KOR: 22, ECU: 23,
  AUT: 24, AUS: 26,
  // ── Pot 3 ────────────────────────────────────────────────────
  NOR: 29, PAN: 30, EGY: 34, ALG: 35, SCO: 36,
  PAR: 39, TUN: 40, CIV: 42, UZB: 50, QAT: 51,
  SAU: 60, RSA: 61,
  // ── Pot 4 ────────────────────────────────────────────────────
  JOR: 66, CPV: 68, GHA: 72, CUW: 82, HTI: 84, NZL: 86,
  BIH: 55, SWE: 25, TUR: 28, CZE: 43,
  COD: 63, IRQ: 56,
};

// ──────────────────────────────────────────────────────────────────
// FIFA 공식 랭킹 - 실시간 (2026년 3월 기준 하드코딩 — 추후 API 연동 예정)
// 출처: FIFA 공식 랭킹 (2026년 3월 발표)
// 팀 이름 옆 표시 용도 (타이브레이커는 FIFA_RANKINGS_DRAW 사용)
// TODO: API 연동 시 이 상수를 서버 응답으로 대체
// ──────────────────────────────────────────────────────────────────
export const FIFA_RANKINGS_CURRENT = {
  // Pot 1
  ESP:  1, ARG:  2, FRA:  3, ENG:  4, BRA:  5,
  POR:  6, NED:  7, MAR:  8, BEL:  9, GER: 10,
  USA: 15, MEX: 16, CAN: 29,  // 개최국 3팀
  // Pot 2
  CRO: 11, SEN: 12, COL: 14, URU: 17, CHE: 18,
  JPN: 19, IRN: 20, KOR: 22, ECU: 23, AUT: 24,
  AUS: 27, ALG: 28,
  // Pot 3
  EGY: 31, NOR: 32, PAN: 33, CIV: 37, SCO: 38,
  PAR: 40, TUN: 47, UZB: 60, GHA: 65, SAU: 55,
  RSA: 58, JOR: 70,
  // Pot 4
  QAT: 75, CPV: 80, HTI: 82, NZL: 85, CUW: 88,
  BIH: 56, SWE: 26, TUR: 30, CZE: 45,
  COD: 64, IRQ: 57,
};

// 하위 호환 alias (기존 import 유지)
export const FIFA_RANKINGS = FIFA_RANKINGS_DRAW;

// 팀별 글로벌 시드 번호 (1=최강, 48=최약)
// 포트 순서 기반: Pot1(1-12) → Pot2(13-24) → Pot3(25-36) → Pot4(37-48)
// 경기 전 타이브레이커 "히든 룰"로 사용 (낮을수록 상위 시드)
export const TEAM_SEEDS = (() => {
  const seeds = {};
  let seed = 1;
  [DRAW_POTS.pot1, DRAW_POTS.pot2, DRAW_POTS.pot3, DRAW_POTS.pot4].forEach((pot) => {
    pot.forEach((team) => { seeds[team.id] = seed++; });
  });
  return seeds;
})();
