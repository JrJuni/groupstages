# Architecture Deep Dive

## Core Architecture: Engine → League → Shim 패턴

멀티리그 플랫폼으로의 확장을 위해 3계층으로 분리:

```
src/engine/          순수 알고리즘 (리그 무관, 외부 의존 zero)
  ├── types.js         LeagueConfig JSDoc 타입 정의
  ├── rankings.js      calculateStandings(teams, matches, options)
  ├── scenarioComputer.js  runBruteForce(teamId, teams, matches, options)
  └── draw.js          createInitialDrawState/runFullDraw(pots, options)

src/leagues/worldcup2026/   FIFA 2026 전용 데이터 + 설정
  ├── config.js        LeagueConfig 객체 (fairPlay, tiebreakers, drawConstraints 등)
  ├── data.js          INITIAL_GROUPS, MATCH_SCHEDULE, DRAW_POTS, FIFA_RANKINGS 등
  └── index.js         re-export

src/utils/           FIFA 기본값을 바인딩하는 shim (기존 import 경로 유지)
  ├── rankings.js      engine/rankings + FIFA tiebreakers 바인딩
  ├── scenarioComputer.js  engine/scenarioComputer + advancementSlots=2
  └── draw.js          engine/draw + FIFA 제약조건 바인딩
```

**핵심 규칙**:
- `engine/`은 `leagues/`, `data/`, `utils/`를 절대 import하지 않음 (순수 파라미터 주입)
- 새 리그 추가 시 `src/leagues/new-league/` 폴더만 생성하면 됨
- 컴포넌트는 `utils/` shim을 통해 engine에 접근 (직접 engine import 금지)

## 데이터 흐름 원칙 (단일 소스)

모든 순위/확정 판정은 **App 레벨에서 한 번 계산** → props로 하위 컴포넌트에 전달.
컴포넌트 내부에서 순위/확정 로직을 자체 구현하면 탭 간 불일치 발생 → **금지**.

```
[단일 소스] groups (useMatches / useTestMatches)
     ↓ useMemo
[App 레벨 계산]
  allGroupStandings   — 조별 순위
  best8               — 3위 상위 8팀 (getBest8ThirdPlace)
  thirdAnalysis       — 3위 조합 분석 (analyzeThirdPlaceCombinations)
                        → validKeys, slotConfirmed, qualifiedGroups, eliminatedGroups
  allThirds           — 3위 전체 목록 (qualified/eliminated 필드 포함)
     ↓ props
[컴포넌트] — 계산 결과만 렌더링, 자체 판정 로직 금지
  GroupTable          ← allGroupStandings
  ThirdPlaceTable     ← best8, allThirds (qualified/eliminated 필드 사용)
  BracketPage         ← groups, allGroupStandings, best8, thirdAnalysis
  ScenarioPage        ← groups
```

**금지 사항**:
- 컴포넌트 내부에서 `calculateStandings`/`computeThirdRange` 등 직접 호출하여 판정하지 말 것
- 3위 진출/탈락 판정은 반드시 `analyzeThirdPlaceCombinations` (engine/knockout.js) 사용
- App.jsx와 TestApp.jsx 간 계산 로직 중복 금지 — 동일 함수(utils/) 사용

## Key Modules

### Hooks
- `useMatches(leagueConfig)` — API 연동 match state (점수 변경 → DB 저장)
- `useTestMatches()` — 로컬 전용 (MOCK_RESULTS로 MD1+MD2 사전 입력)
- `useLocalStorage(key, default)` — `[value, set, remove]` 튜플 반환, `LS_KEYS` 상수

### Scenario 컴포넌트 (src/components/scenario/)
ScenarioPage.jsx(~200줄 오케스트레이터)에서 하위 7개 파일로 분리:
- `shared.jsx` — RANK_BG, formatLocalTime (사용자 로컬 시간대), TeamFlag, 카드 아이콘
- `TeamScenarioPanel.jsx` — computeTeamScenarios + useMemo 브루트포스
- `ScenarioMatrix.jsx` — 3×3 W/D/L 매트릭스
- `QualConditionSummary.jsx` — 진출 조건 텍스트
- `GroupStandingsTable.jsx`, `MatchRow.jsx`, `RankCell.jsx`, `shareHelpers.js`

### 순위 계산 (engine/rankings.js)
FIFA 타이브레이커 체인: 승점 → 득실차 → 다득점 → 헤드투헤드(재귀적) → 페어플레이 → FIFA 랭킹 → 시드
- `calculateStandings(teams, matches, { tiebreakers, fairPlayScorer })` 
- `getBestThirdPlace(allGroupStandings, count, options)` — count 파라미터화 (FIFA=8)

### 시나리오 엔진 (engine/scenarioComputer.js)
포아송 λ=1.4 가중 브루트포스 (6,561 조합/그룹):
- `runBruteForce(teamId, teams, matches, { advancementSlots, thirdMinPts, standingsOptions })`

### 조추첨 엔진 (engine/draw.js)
- `createInitialDrawState(pots, { prePlacements, constraintChecker, ... })` — 사전 배정 적용
- `drawOneTeam(state, potKey)` — 1단계 feasibility → 2/3단계 fallback
- `runFullDraw` / `generateDrawSteps` — fallback 발동 시 최대 200회 재시도

## Asset Conventions

### 국기 이미지
- `public/flags/{iso2}.png` (예: `kr.png`, `gb-sct.png`)
- 소스: flagcdn.com/w80/{iso2}.png
- 컴포넌트: `${BASE_URL}${team.flagImg}`, fallback은 이모지 `team.flag`

### 팀 데이터 (src/leagues/worldcup2026/data.js)
- `INITIAL_GROUPS`: 48팀 12조 (A~L), 각 팀 `{id, name, flag, flagImg, confederation, yc, twoYR, dr}`
- `MATCH_SCHEDULE`: 72경기 일정 (API 미연결 시 fallback, 프로덕션은 D1에서 자동 동기화)
- `DRAW_POTS`: Pot 1~4
- `FIFA_RANKINGS_DRAW / FIFA_RANKINGS_CURRENT`: 팀ID → 랭킹
