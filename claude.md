# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start
```bash
npm run dev          # API(3001) + Vite(5000) 동시 실행
npm run dev:vite     # Vite만 (API 없이 로컬 모드)
npm run build        # 프로덕션 빌드
```

No test framework configured. Verify changes with `npx vite build` (0 warnings expected).

## Production 배포 (groupstages.com)

```
Frontend: Cloudflare Pages → dist/ (프로젝트명: groupstages)
Backend:  Cloudflare Workers → workers/index.js + D1 SQLite (프로젝트명: groupstages-api)
```

```bash
# 프론트엔드
VITE_API_URL=https://groupstages-api.behomely0409.workers.dev npm run build
npx wrangler pages deploy dist --project-name groupstages --branch main

# Workers API (필요 시)
npx wrangler deploy
```

- **Git push ≠ 자동배포** — GitHub 연동 없음, 수동 배포
- **Workers vs Express**: 로컬은 `server/index.js` (Node+PostgreSQL), 프로덕션은 `workers/index.js` (D1)
- **프로덕션 URL**: https://groupstages.com/wc2026/
- **Workers API**: https://groupstages-api.behomely0409.workers.dev
- **D1 Database ID**: `13ee6163-ca10-40cf-8df2-b770146d80f3`

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + React Router 7
- **Backend (로컬)**: Node.js + Express (ESM) — port 3001
- **Backend (프로덕션)**: Cloudflare Workers + D1 (SQLite)
- **Database (로컬)**: PostgreSQL via `pg`
- **External API**: API-Football (RapidAPI) — 7500 requests/day

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

## Routing

React Router, base path `/wc2026/`:
- `/` → `App.jsx` (프로덕션, API 연동)
- `/wctest` → `TestApp.jsx` (테스트, MOCK_RESULTS 사전 입력, DB 미사용)

App 내부는 탭 기반 전환 (조별리그, 경우의 수, 3위 순위, 조추첨, 규칙).

## Key Modules

### Hooks
- `useMatches(leagueConfig)` — API 연동 match state (점수 변경 → DB 저장)
- `useTestMatches()` — 로컬 전용 (MOCK_RESULTS로 MD1+MD2 사전 입력)
- `useLocalStorage(key, default)` — `[value, set, remove]` 튜플 반환, `LS_KEYS` 상수

### Scenario 컴포넌트 (src/components/scenario/)
ScenarioPage.jsx(~200줄 오케스트레이터)에서 하위 7개 파일로 분리:
- `shared.jsx` — RANK_BG, formatKST, TeamFlag, 카드 아이콘
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
FIFA 2026 공식 추첨 룰: 호스트 사전 배정 (MEX→A, CAN→B, USA→D), 컨페더레이션 제약 (UEFA 최대 2, 그 외 1), 톱4 시드 quarter 분리 (ESP/ARG/FRA/ENG가 각각 다른 quarter), pot당 그룹당 1팀.
- `createInitialDrawState(pots, { prePlacements, constraintChecker, ... })` — 사전 배정 적용
- `drawOneTeam(state, potKey)` — 1단계 feasibility → 2/3단계 fallback (`_fallbackTriggered` 표시)
- `runFullDraw` / `generateDrawSteps` — fallback 발동 시 최대 200회 재시도, 룰 위반 없는 결과만 반환
- 룰 상수는 `leagues/worldcup2026/data.js`의 `HOST_PRE_PLACEMENTS` / `TOP_SEED_IDS` / `GROUP_QUARTERS`. **토너먼트 구조 변경 시 `GROUP_QUARTERS` 동기 갱신 필요**.

## Asset Conventions

### 국기 이미지
- `public/flags/{iso2}.png` (예: `kr.png`, `gb-sct.png`)
- 소스: flagcdn.com/w80/{iso2}.png
- 컴포넌트: `${BASE_URL}${team.flagImg}`, fallback은 이모지 `team.flag`

### 팀 데이터 (src/leagues/worldcup2026/data.js)
- `INITIAL_GROUPS`: 48팀 12조 (A~L), 각 팀 `{id, name, flag, flagImg, confederation, yc, twoYR, dr}`
- `MATCH_SCHEDULE`: 72경기 일정
- `DRAW_POTS`: Pot 1~4
- `FIFA_RANKINGS_DRAW / FIFA_RANKINGS_CURRENT`: 팀ID → 랭킹

## Vite Config
- Base path: `/wc2026/`
- Dev proxy: `/api` → `http://localhost:3001`
- Tailwind custom theme: fifa-dark, fifa-card, fifa-border, fifa-gold 등

## Database Schema (PostgreSQL / D1)
주요 테이블: `match_results` (경기 결과), `team_mapping` (API 팀 ID), `team_statistics` (카드/페어플레이), `api_sync_log`
스키마: `scripts/init_schema.sql` (PG), `workers/schema.sql` (D1)

## API Endpoints
- `GET/POST/DELETE /api/matches` — 경기 결과 CRUD
- `GET /api/third-place` — 3위팀 집계
- `POST /api/sync/fixtures` — API-Football 동기화 (로컬: Express, 프로덕션: Workers + X-Sync-Secret 인증)
- `GET /api/sync/status` — 최근 sync 이력 조회 (프로덕션)
- `POST/GET /api/sync/elo` — ELO 캐시 (로컬 전용)

## Cron Sync (Workers)
- **스케줄**: `*/5 * * * *` (매 5분) — `wrangler.toml` [triggers]
- **로직**: `workers/sync.js` → API-Football `/fixtures` 1회 호출 → D1 `match_results` 배치 UPDATE
- **인증**: `x-apisports-key` (API-Football 직접, RapidAPI 아님)
- **Secrets**: `API_FOOTBALL_KEY`, `SYNC_SECRET` (wrangler secret)
- **team_mapping**: D1에 48팀 등록 완료 (API-Football ID ↔ 내부 ID)
- **일일 소모**: 하루 288회 (쿼터 7,500의 3.8%)

## Environment Variables (.env)
```bash
API_FOOTBALL_KEY=...   # api-football.com 직접 키 (x-apisports-key)
DATABASE_URL=postgresql://...
API_PORT=3001
```

## Known Issues
- Workers에 ELO/sync 라우트 미포팅 (ELO만 — fixtures sync는 포팅 완료)
- 시나리오 가중치에 ELO 미반영 (캐시만 구축)
- 카드 데이터 영속성 없음
- App.jsx UI 문자열 일부 FIFA 하드코딩 (두 번째 리그 추가 시 leagueConfig으로 이전 필요)
- DrawSimulator가 leagues/ 직접 import (props 패턴으로 전환 예정)

## GitHub
- https://github.com/JrJuni/groupstages.git (main branch)
