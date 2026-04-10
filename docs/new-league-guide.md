# 새 리그 추가 가이드

## 1. 디렉토리 구조

```
src/leagues/new-league/
  ├── config.js        LeagueConfig 객체 (아래 스키마 참조)
  ├── data.js          조편성, 일정, 랭킹, 포트 등 정적 데이터
  └── index.js         export { default as leagueConfig } from './config.js'; export * from './data.js';
```

## 2. LeagueConfig 스키마 (src/engine/types.js)

```javascript
{
  id: 'championsleague2526',     // 리그 고유 식별자
  name: 'UEFA Champions League', // 표시 이름
  groupCount: 8,                 // 조 수
  teamsPerGroup: 4,              // 조당 팀 수
  advancementSlots: 2,           // 조별 직접 진출 수
  thirdPlaceAdvancing: null,     // 3위 진출 팀 수 (null → 3위 로직 비활성화)
  thirdPlaceMinPts: null,        // 시나리오 커트라인 승점

  // 함수
  fairPlayScore: (team) => ...,          // 페어플레이 점수 계산
  tiebreakers: [(a, b) => ...],          // h2h 이후 추가 타이브레이커 체인
  drawConstraintChecker: (group, team) => bool, // 조추첨 제약 (null 가능)

  // 데이터
  groups: INITIAL_GROUPS,           // { A: { teams: [...] }, B: ... }
  matchSchedule: MATCH_SCHEDULE,    // { matchId: { matchday, date, venue, city } }
  rankings: RANKINGS,               // { teamId: number }
  rankingsCurrent: RANKINGS_LIVE,   // 실시간 랭킹 (선택)
  seeds: TEAM_SEEDS,                // { teamId: seedNumber } (선택)
  drawPots: DRAW_POTS,              // { pot1: [...], pot2: [...] } (선택)
  knockoutBracket: KNOCKOUT_BRACKET,// 토너먼트 대진표 구조 (선택)
}
```

## 3. 팀 데이터 형식

```javascript
{
  id: 'MCI',                    // 고유 팀 ID (3자리 코드)
  name: '맨시티',                // 기본 표시 이름 (ko)
  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',               // 이모지 fallback
  flagImg: 'flags/gb-eng.png',  // 국기/엠블럼 이미지 경로
  confederation: 'UEFA',        // 소속 연맹/리그
  yc: 0, twoYR: 0, dr: 0,      // 카드 데이터 (페어플레이용)
}
```

## 4. i18n 팀명

각 리그별로 `src/i18n/locales/{lang}/teams-{leagueId}.json` 추가:
```json
{ "MCI": "Manchester City", "RMA": "Real Madrid" }
```
`useTeamName()` 훅이 `team.id`로 번역 조회 → 없으면 `team.name` fallback.

## 5. engine/ 모듈 — 리그별 파라미터 주입

| 엔진 함수 | 핵심 파라미터 | FIFA 2026 값 | 리그별 변경점 |
|-----------|-------------|-------------|-------------|
| `calculateStandings(teams, matches, opts)` | `tiebreakers`, `fairPlayScorer` | h2h재귀→FP→FIFA랭킹→시드 | 리그 규칙에 맞게 교체 |
| `runBruteForce(teamId, teams, matches, opts)` | `advancementSlots`, `thirdMinPts` | 2, 4 | 진출 구조에 맞게 |
| `createInitialDrawState(pots, opts)` | `prePlacements`, `constraintChecker` | 호스트배정, 대륙제약 | 리그 추첨 룰 |
| `getBestThirdPlace(standings, count)` | `count` | 8 | 3위 진출 수 (없으면 호출 안 함) |

## 6. API-Football 연동

**Base URL**: `https://v3.football.api-sports.io`
**인증**: `x-apisports-key` 헤더 (api-football.com 직접 계정)
**일일 쿼터**: 7,500건 (리그 수로 나눠서 cron 빈도 조절)

| 엔드포인트 | 용도 | 주요 파라미터 |
|-----------|------|-------------|
| `GET /fixtures` | 경기 일정 + 결과 | `league={id}&season={year}` |
| `GET /fixtures` | 특정 경기 상세 | `id={fixtureId}` |
| `GET /fixtures/events` | 경기 이벤트 (골/카드) | `fixture={fixtureId}` |
| `GET /fixtures/statistics` | 경기 통계 | `fixture={fixtureId}` |
| `GET /teams` | 팀 목록 (team_mapping용) | `league={id}&season={year}` |
| `GET /standings` | 리그 순위표 | `league={id}&season={year}` |
| `GET /status` | Rate Limit 확인 | — |

**리그 ID 예시** (API-Football):
- FIFA World Cup: `league=1`
- Premier League: `league=39`
- La Liga: `league=140`
- Champions League: `league=2`
- Bundesliga: `league=78`
- Serie A: `league=135`
- Ligue 1: `league=61`

## 7. Workers Cron Sync 확장

- `workers/sync.js`에서 `env.WORLD_CUP_LEAGUE_ID` → 리그별 환경변수
- 여러 리그 동시 sync 시 `wrangler.toml`에 리그별 vars 또는 단일 cron에서 복수 리그 순회
- **쿼터 관리**: 리그 N개 × 5분 = N×288건/일. 3개 리그면 864건 (11.5%)

## 8. DB 스키마 확장 (D1)

현재 스키마는 리그 구분 없음. 멀티리그 시 `league_id` 컬럼 추가 필요:
```sql
ALTER TABLE match_results ADD COLUMN league_id TEXT DEFAULT 'worldcup2026';
ALTER TABLE team_mapping ADD COLUMN league_id TEXT DEFAULT 'worldcup2026';
ALTER TABLE team_statistics ADD COLUMN league_id TEXT DEFAULT 'worldcup2026';
```

## 9. 라우팅 확장

```
/wc2026/:lang       → FIFA 2026 World Cup
/epl2526/:lang      → Premier League 2025-26
/ucl2526/:lang      → Champions League 2025-26
```

`vite.config.js`의 `base` 경로와 `main.jsx` Routes 추가 필요.

## 10. 아직 하드코딩된 부분 (전환 필요)

| 위치 | 내용 | 전환 방법 |
|------|------|----------|
| `DrawSimulator.jsx` | `leagues/worldcup2026/data.js` 직접 import | props로 pots/constraints 주입 |
| `App.jsx` 일부 문자열 | FIFA 하드코딩 | `leagueConfig.name` 등 사용 |
| `workers/sync.js` | league=1 고정 | `env.LEAGUE_ID` 환경변수화 |
| `wrangler.toml` | `WORLD_CUP_LEAGUE_ID = "1"` | 리그별 vars 또는 JSON config |
