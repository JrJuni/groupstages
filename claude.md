# GroupStages - 2026 FIFA World Cup Calculator

## Quick Start
```bash
npm run dev    # API(3001) + Vite(5000) 동시 실행
```

## 🚀 Production 배포 구조 (groupstages.com)

### 아키텍처
```
groupstages.com
├── Frontend: Cloudflare Pages (프로젝트명: groupstages)
│   └── 정적 React 빌드 → dist/ 폴더 배포
└── Backend:  Cloudflare Workers (프로젝트명: groupstages-api)
    └── workers/index.js → D1 (SQLite) DB 사용
```

### 배포 명령어 (프로덕션 반영 시)
```bash
# 1. 프론트엔드 빌드 (VITE_API_URL 필수)
VITE_API_URL=https://groupstages-api.behomely0409.workers.dev npm run build

# 2. Cloudflare Pages 배포
npx wrangler pages deploy dist --project-name groupstages --branch main

# (필요 시) Workers API 배포
npx wrangler deploy
```

### 주요 URL
- **프로덕션**: https://groupstages.com/wc2026/
- **Workers API**: https://groupstages-api.behomely0409.workers.dev
- **Cloudflare Account**: behomely0409@gmail.com

### 중요 주의사항
- **Git push ≠ 자동배포** — GitHub 연동 없음, 수동으로 위 명령어 실행 필요
- **Workers vs Express**: 로컬 개발은 `server/index.js` (Node+PostgreSQL), 프로덕션은 `workers/index.js` (D1+SQLite)
- **ELO/sync 기능**: `server/` 의 sync 라우트는 로컬 전용. Workers에는 미구현 (추후 작업 필요)
- **D1 Database ID**: `13ee6163-ca10-40cf-8df2-b770146d80f3`

---

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Backend (로컬)**: Node.js + Express (ESM) - port 3001
- **Backend (프로덕션)**: Cloudflare Workers + D1 (SQLite)
- **Database (로컬)**: PostgreSQL via `pg` driver
- **Database (프로덕션)**: Cloudflare D1 (SQLite)
- **External API**: API-Football (RapidAPI) - 7500 requests/day
- **Caching**: JSON 파일 기반 (ELO: cache/elo_worldcup_2026.json)

## Core Architecture
- 로컬: Express REST API (`server/index.js`) on port 3001
- 로컬: Vite dev server proxies `/api` → `localhost:3001`
- 프로덕션: Workers API (`workers/index.js`) — D1 SQLite
- API-Football 연동: 양방향 경기 매칭 (48/54 경기 동기화)

## Database Schema (PostgreSQL)
```sql
-- 경기 결과
CREATE TABLE match_results (
  id         VARCHAR(100) PRIMARY KEY,
  group_key  CHAR(1)      NOT NULL,
  home_id    VARCHAR(30)  NOT NULL,
  away_id    VARCHAR(30)  NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchday   SMALLINT,
  match_date TIMESTAMPTZ,
  status     VARCHAR(10)  DEFAULT 'NS',
  fixture_id INTEGER,
  updated_at TIMESTAMP    DEFAULT NOW()
);

-- API 팀 ID 매핑 (40/42팀 매핑 완료)
CREATE TABLE team_mapping (
  our_team_id   VARCHAR(30) PRIMARY KEY,
  api_team_id   INTEGER NOT NULL UNIQUE,
  api_team_name VARCHAR(100),
  api_team_code VARCHAR(10)
);

-- 카드 통계 (Fair Play)
CREATE TABLE team_statistics (
  team_id         VARCHAR(30) NOT NULL,
  group_key       CHAR(1)     NOT NULL,
  yellow_cards    INTEGER DEFAULT 0,
  two_yellow_red  INTEGER DEFAULT 0,
  direct_red      INTEGER DEFAULT 0,
  fair_play_points INTEGER DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, group_key)
);

-- API 동기화 로그
CREATE TABLE api_sync_log (
  id               SERIAL PRIMARY KEY,
  sync_type        VARCHAR(50) NOT NULL,
  status           VARCHAR(20) NOT NULL,
  fixtures_synced  INTEGER DEFAULT 0,
  teams_synced     INTEGER DEFAULT 0,
  error_message    TEXT,
  sync_duration_ms INTEGER,
  synced_at        TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Match CRUD
- `GET  /api/matches` - 모든 경기 결과 조회
- `POST /api/matches` - 경기 결과 upsert
- `DELETE /api/matches/:id` - 특정 경기 초기화
- `GET  /api/third-place` - 3위팀 집계 쿼리

### API-Football 동기화
- `POST /api/sync/fixtures` - 경기 일정/결과 동기화 (54/54 성공)
- `POST /api/sync/card-statistics/:fixtureId` - 카드 통계 동기화
- `GET  /api/sync/status` - Rate Limit 및 동기화 이력

### ELO (로컬 전용)
- `POST /api/sync/elo` - eloratings.net에서 ELO 가져오기 (하루 10회 제한, `?force=true`)
- `GET  /api/elo` - 캐시된 ELO 반환
- `GET  /api/sync/elo/status` - ELO 캐시 상태

## Key Features
1. **조별리그 순위 계산**: FIFA 공식 규칙 (승점 → 득실차 → 다득점 → 헤드투헤드)
2. **3위팀 상위 8팀**: DB 쿼리 자동 집계 + 진출확정/탈락확정 판정
3. **경우의 수 시나리오**: 포아송 λ=1.4 가중 브루트포스 엔진 (6,561 조합)
4. **조추첨 시뮬레이터**: Pot 1-4, 지리적 제약조건
5. **API-Football 연동**: 실시간 경기 결과 (캐싱 적용)
6. **ELO 캐시**: eloratings.net 기반, 42개 확정팀 매핑
7. **공유 기능**: Reddit Markdown, HTML 표, 이미지 저장
8. **세션 유지**: 탭 + 시나리오 선택 localStorage 저장

## Project Structure
```
server/                         # 로컬 개발 전용
  index.js                    - Express API (GET /api/elo 포함)
  routes/syncRoutes.js        - API-Football + ELO 동기화
  services/
    apiFootballService.js     - API-Football 래퍼 (캐싱)
    cacheService.js           - JSON 캐시 (TTL)
    eloService.js             - eloratings.net ELO 캐시 (코드 매핑 내장)
workers/                        # 프로덕션 (Cloudflare Workers)
  index.js                    - Workers API (D1 SQLite)
  schema.sql                  - D1 스키마
scripts/
  init_schema.sql             - PostgreSQL 스키마
  generateTeamMapping.js      - 팀 ID 매핑
  seedMatches.js              - 경기 일정 seed
src/
  hooks/useMatches.js         - API 연동 훅
  hooks/useTestMatches.js     - 테스트 모드 로컬 훅
  data/worldcup2026.js        - 48팀 + 경기 일정
  utils/rankings.js           - 순위 계산
  utils/scenarioComputer.js   - 포아송 가중 브루트포스 엔진
  config.js                   - API URL 설정 (로컬/프로덕션 분기)
  components/
    GroupTable.jsx            - 조 순위표
    ThirdPlaceTable.jsx       - 3위팀 비교 (진출확정/탈락확정)
    ScenarioPage.jsx          - 경우의 수 (매트릭스 + 조건 텍스트)
    DrawSimulator.jsx         - 조추첨 시뮬레이터
    ShareButtons.jsx          - 공유 (Reddit MD / HTML / 이미지)
  App.jsx                     - 메인 앱 (DB 연동)
  TestApp.jsx                 - 테스트 앱 (로컬 데이터)
cache/                        - ELO + API 응답 캐시 (gitignored)
logs/                         - 프로젝트 문서 + 상태 대시보드
```

## Environment Variables (.env)
```bash
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=v3.football.api-sports.io
WORLD_CUP_LEAGUE_ID=1
WORLD_CUP_SEASON=2026
DATABASE_URL=postgresql://username@localhost:5432/groupstages_2026?sslmode=disable
API_PORT=3001
```

## Known Issues
- **Workers 미동기**: ELO, sync 라우트는 로컬 Express 전용. Workers 포팅 필요
- **ELO 미반영**: 시나리오 가중치에 ELO 미적용 (캐시만 구축됨)
- **카드 데이터**: 아직 영속성 없음 (team_statistics API 필요)
- **3위 커트라인**: `THIRD_PLACE_MIN_PTS = 4` 고정 (대회 진행 후 변동 가능)

## Next Steps
1. ELO를 시나리오 확률 가중치에 반영
2. Workers에 ELO/sync 기능 포팅
3. 카드 데이터 API 엔드포인트 추가
4. 랜딩 페이지 디자인
5. SEO / AdSense 최적화

## GitHub
- Repository: https://github.com/JrJuni/groupstages.git
- Branch: main
