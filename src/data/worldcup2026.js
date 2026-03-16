export const CONFEDERATIONS = {
  UEFA: { name: 'UEFA', color: '#003399', bg: '#e8f0ff' },
  CAF: { name: 'CAF', color: '#009900', bg: '#e8ffe8' },
  CONMEBOL: { name: 'CONMEBOL', color: '#ffcc00', bg: '#fffbe8' },
  AFC: { name: 'AFC', color: '#cc0000', bg: '#ffe8e8' },
  CONCACAF: { name: 'CONCACAF', color: '#ff6600', bg: '#fff0e8' },
  OFC: { name: 'OFC', color: '#6600cc', bg: '#f0e8ff' },
};

// 2026 FIFA World Cup - 48 teams across 12 groups
// Flag emojis for visual appeal
export const INITIAL_GROUPS = {
  A: {
    teams: [
      { id: 'USA', name: '미국', flag: '🇺🇸', confederation: 'CONCACAF', host: true },
      { id: 'MEX', name: '멕시코', flag: '🇲🇽', confederation: 'CONCACAF', host: true },
      { id: 'CAN', name: '캐나다', flag: '🇨🇦', confederation: 'CONCACAF', host: true },
      { id: 'URU', name: '우루과이', flag: '🇺🇾', confederation: 'CONMEBOL' },
    ],
  },
  B: {
    teams: [
      { id: 'ARG', name: '아르헨티나', flag: '🇦🇷', confederation: 'CONMEBOL' },
      { id: 'GER', name: '독일', flag: '🇩🇪', confederation: 'UEFA' },
      { id: 'JPN', name: '일본', flag: '🇯🇵', confederation: 'AFC' },
      { id: 'SEN', name: '세네갈', flag: '🇸🇳', confederation: 'CAF' },
    ],
  },
  C: {
    teams: [
      { id: 'BRA', name: '브라질', flag: '🇧🇷', confederation: 'CONMEBOL' },
      { id: 'FRA', name: '프랑스', flag: '🇫🇷', confederation: 'UEFA' },
      { id: 'AUS', name: '호주', flag: '🇦🇺', confederation: 'AFC' },
      { id: 'MAR', name: '모로코', flag: '🇲🇦', confederation: 'CAF' },
    ],
  },
  D: {
    teams: [
      { id: 'ENG', name: '잉글랜드', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
      { id: 'ESP', name: '스페인', flag: '🇪🇸', confederation: 'UEFA' },
      { id: 'KOR', name: '대한민국', flag: '🇰🇷', confederation: 'AFC' },
      { id: 'COL', name: '콜롬비아', flag: '🇨🇴', confederation: 'CONMEBOL' },
    ],
  },
  E: {
    teams: [
      { id: 'POR', name: '포르투갈', flag: '🇵🇹', confederation: 'UEFA' },
      { id: 'NED', name: '네덜란드', flag: '🇳🇱', confederation: 'UEFA' },
      { id: 'MEX2', name: '이란', flag: '🇮🇷', confederation: 'AFC' },
      { id: 'NGA', name: '나이지리아', flag: '🇳🇬', confederation: 'CAF' },
    ],
  },
  F: {
    teams: [
      { id: 'BEL', name: '벨기에', flag: '🇧🇪', confederation: 'UEFA' },
      { id: 'ITA', name: '이탈리아', flag: '🇮🇹', confederation: 'UEFA' },
      { id: 'SAU', name: '사우디아라비아', flag: '🇸🇦', confederation: 'AFC' },
      { id: 'ECU', name: '에콰도르', flag: '🇪🇨', confederation: 'CONMEBOL' },
    ],
  },
  G: {
    teams: [
      { id: 'CHE', name: '스위스', flag: '🇨🇭', confederation: 'UEFA' },
      { id: 'DEN', name: '덴마크', flag: '🇩🇰', confederation: 'UEFA' },
      { id: 'MEX3', name: '카타르', flag: '🇶🇦', confederation: 'AFC' },
      { id: 'GHA', name: '가나', flag: '🇬🇭', confederation: 'CAF' },
    ],
  },
  H: {
    teams: [
      { id: 'CRO', name: '크로아티아', flag: '🇭🇷', confederation: 'UEFA' },
      { id: 'AUT', name: '오스트리아', flag: '🇦🇹', confederation: 'UEFA' },
      { id: 'JOR', name: '요르단', flag: '🇯🇴', confederation: 'AFC' },
      { id: 'CMR', name: '카메룬', flag: '🇨🇲', confederation: 'CAF' },
    ],
  },
  I: {
    teams: [
      { id: 'TUR', name: '튀르키예', flag: '🇹🇷', confederation: 'UEFA' },
      { id: 'SCO', name: '스코틀랜드', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA' },
      { id: 'PAR', name: '파라과이', flag: '🇵🇾', confederation: 'CONMEBOL' },
      { id: 'EGY', name: '이집트', flag: '🇪🇬', confederation: 'CAF' },
    ],
  },
  J: {
    teams: [
      { id: 'POL', name: '폴란드', flag: '🇵🇱', confederation: 'UEFA' },
      { id: 'UKR', name: '우크라이나', flag: '🇺🇦', confederation: 'UEFA' },
      { id: 'VEN', name: '베네수엘라', flag: '🇻🇪', confederation: 'CONMEBOL' },
      { id: 'MLI', name: '말리', flag: '🇲🇱', confederation: 'CAF' },
    ],
  },
  K: {
    teams: [
      { id: 'SRB', name: '세르비아', flag: '🇷🇸', confederation: 'UEFA' },
      { id: 'CZE', name: '체코', flag: '🇨🇿', confederation: 'UEFA' },
      { id: 'CRC', name: '코스타리카', flag: '🇨🇷', confederation: 'CONCACAF' },
      { id: 'ALG', name: '알제리', flag: '🇩🇿', confederation: 'CAF' },
    ],
  },
  L: {
    teams: [
      { id: 'POR2', name: '슬로베니아', flag: '🇸🇮', confederation: 'UEFA' },
      { id: 'HUN', name: '헝가리', flag: '🇭🇺', confederation: 'UEFA' },
      { id: 'NZL', name: '뉴질랜드', flag: '🇳🇿', confederation: 'OFC' },
      { id: 'CIV', name: '코트디부아르', flag: '🇨🇮', confederation: 'CAF' },
    ],
  },
};

// 2026 WC Round of 32 bracket mapping
// 3위 상위 8팀 결정 후 배정 규칙
export const THIRD_PLACE_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// 16강 대진 규칙 (FIFA 공식 기준)
// 1위 자동 배정 + 2위 상대방 + 3위팀 배정 복잡 규칙
export const R32_MATCHUPS = [
  { slot: 1, team1: '1A', team2: '2B' },
  { slot: 2, team1: '1B', team2: '2A' },
  { slot: 3, team1: '1C', team2: '2D' },
  { slot: 4, team1: '1D', team2: '2C' },
  { slot: 5, team1: '1E', team2: '2F' },
  { slot: 6, team1: '1F', team2: '2E' },
  { slot: 7, team1: '1G', team2: '2H' },
  { slot: 8, team1: '1H', team2: '2G' },
  { slot: 9, team1: '1I', team2: '2J' },
  { slot: 10, team1: '1J', team2: '2I' },
  { slot: 11, team1: '1K', team2: '2L' },
  { slot: 12, team1: '1L', team2: '2K' },
  { slot: 13, team1: '3rd-1', team2: '3rd-2' },
  { slot: 14, team1: '3rd-3', team2: '3rd-4' },
  { slot: 15, team1: '3rd-5', team2: '3rd-6' },
  { slot: 16, team1: '3rd-7', team2: '3rd-8' },
];

// 조추첨 Pot 시스템 (예시: 2026 WC 형식)
export const DRAW_POTS = {
  pot1: [
    { id: 'ARG', name: '아르헨티나', flag: '🇦🇷', confederation: 'CONMEBOL' },
    { id: 'FRA', name: '프랑스', flag: '🇫🇷', confederation: 'UEFA' },
    { id: 'ENG', name: '잉글랜드', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
    { id: 'BRA', name: '브라질', flag: '🇧🇷', confederation: 'CONMEBOL' },
    { id: 'ESP', name: '스페인', flag: '🇪🇸', confederation: 'UEFA' },
    { id: 'GER', name: '독일', flag: '🇩🇪', confederation: 'UEFA' },
    { id: 'POR', name: '포르투갈', flag: '🇵🇹', confederation: 'UEFA' },
    { id: 'NED', name: '네덜란드', flag: '🇳🇱', confederation: 'UEFA' },
    { id: 'BEL', name: '벨기에', flag: '🇧🇪', confederation: 'UEFA' },
    { id: 'ITA', name: '이탈리아', flag: '🇮🇹', confederation: 'UEFA' },
    { id: 'USA', name: '미국', flag: '🇺🇸', confederation: 'CONCACAF', host: true },
    { id: 'MEX', name: '멕시코', flag: '🇲🇽', confederation: 'CONCACAF', host: true },
  ],
  pot2: [
    { id: 'CRO', name: '크로아티아', flag: '🇭🇷', confederation: 'UEFA' },
    { id: 'DEN', name: '덴마크', flag: '🇩🇰', confederation: 'UEFA' },
    { id: 'CHE', name: '스위스', flag: '🇨🇭', confederation: 'UEFA' },
    { id: 'JPN', name: '일본', flag: '🇯🇵', confederation: 'AFC' },
    { id: 'KOR', name: '대한민국', flag: '🇰🇷', confederation: 'AFC' },
    { id: 'COL', name: '콜롬비아', flag: '🇨🇴', confederation: 'CONMEBOL' },
    { id: 'URU', name: '우루과이', flag: '🇺🇾', confederation: 'CONMEBOL' },
    { id: 'MAR', name: '모로코', flag: '🇲🇦', confederation: 'CAF' },
    { id: 'SEN', name: '세네갈', flag: '🇸🇳', confederation: 'CAF' },
    { id: 'AUS', name: '호주', flag: '🇦🇺', confederation: 'AFC' },
    { id: 'TUR', name: '튀르키예', flag: '🇹🇷', confederation: 'UEFA' },
    { id: 'CAN', name: '캐나다', flag: '🇨🇦', confederation: 'CONCACAF', host: true },
  ],
  pot3: [
    { id: 'SAU', name: '사우디아라비아', flag: '🇸🇦', confederation: 'AFC' },
    { id: 'NGA', name: '나이지리아', flag: '🇳🇬', confederation: 'CAF' },
    { id: 'ECU', name: '에콰도르', flag: '🇪🇨', confederation: 'CONMEBOL' },
    { id: 'CMR', name: '카메룬', flag: '🇨🇲', confederation: 'CAF' },
    { id: 'GHA', name: '가나', flag: '🇬🇭', confederation: 'CAF' },
    { id: 'SRB', name: '세르비아', flag: '🇷🇸', confederation: 'UEFA' },
    { id: 'POL', name: '폴란드', flag: '🇵🇱', confederation: 'UEFA' },
    { id: 'SCO', name: '스코틀랜드', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA' },
    { id: 'AUT', name: '오스트리아', flag: '🇦🇹', confederation: 'UEFA' },
    { id: 'UKR', name: '우크라이나', flag: '🇺🇦', confederation: 'UEFA' },
    { id: 'EGY', name: '이집트', flag: '🇪🇬', confederation: 'CAF' },
    { id: 'IRN', name: '이란', flag: '🇮🇷', confederation: 'AFC' },
  ],
  pot4: [
    { id: 'PAR', name: '파라과이', flag: '🇵🇾', confederation: 'CONMEBOL' },
    { id: 'VEN', name: '베네수엘라', flag: '🇻🇪', confederation: 'CONMEBOL' },
    { id: 'CRC', name: '코스타리카', flag: '🇨🇷', confederation: 'CONCACAF' },
    { id: 'JOR', name: '요르단', flag: '🇯🇴', confederation: 'AFC' },
    { id: 'QAT', name: '카타르', flag: '🇶🇦', confederation: 'AFC' },
    { id: 'ALG', name: '알제리', flag: '🇩🇿', confederation: 'CAF' },
    { id: 'MLI', name: '말리', flag: '🇲🇱', confederation: 'CAF' },
    { id: 'CIV', name: '코트디부아르', flag: '🇨🇮', confederation: 'CAF' },
    { id: 'NZL', name: '뉴질랜드', flag: '🇳🇿', confederation: 'OFC' },
    { id: 'SVN', name: '슬로베니아', flag: '🇸🇮', confederation: 'UEFA' },
    { id: 'HUN', name: '헝가리', flag: '🇭🇺', confederation: 'UEFA' },
    { id: 'CZE', name: '체코', flag: '🇨🇿', confederation: 'UEFA' },
  ],
};
