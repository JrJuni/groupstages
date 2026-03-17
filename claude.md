# GroupStages - 2026 FIFA World Cup Calculator

## Quick Start
```bash
npm run dev    # API(3001) + Vite(5000) 동시 실행
```

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Backend**: Node.js + Express (ESM) - port 3001
- **Database**: PostgreSQL (로컬) via `pg` driver
- **External API**: API-Football (RapidAPI) - 7500 requests/day
- **Caching**: JSON 파일 기반 (1시간 TTL)

## Core Architecture
- Express REST API (`server/index.js`) on port 3001
- Vite dev server proxies `/api` → `localhost:3001`
- API-Football 연동: 양방향 경기 매칭 (48/54 경기 동기화)
- JSON 캐싱으로 Rate Limit 절약 (550ms → 167ms)

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
- `POST /api/sync/fixtures` - 경기 일정/결과 동기화 (48/54 성공)
- `POST /api/sync/card-statistics/:fixtureId` - 카드 통계 동기화
- `GET  /api/sync/status` - Rate Limit 및 동기화 이력

## Key Features
1. **조별리그 순위 계산**: FIFA 공식 규칙 (승점 → 득실차 → 다득점 → 헤드투헤드)
2. **3위팀 상위 8팀**: DB 쿼리 자동 집계
3. **조추첨 시뮬레이터**: Pot 1-4, 지리적 제약조건
4. **API-Football 연동**: 실시간 경기 결과 (캐싱 적용)
5. **공유 기능**: Reddit Markdown, HTML 표, 이미지 저장

## Project Structure
```
server/
  index.js                    - Express API
  routes/syncRoutes.js        - API-Football 동기화
  services/
    apiFootballService.js     - API 래퍼 (캐싱)
    cacheService.js           - JSON 캐시 (TTL)
scripts/
  init_schema.sql             - DB 스키마
  generateTeamMapping.js      - 팀 ID 매핑
  seedMatches.js              - 경기 일정 seed
src/
  hooks/useMatches.js         - API 연동 훅
  data/worldcup2026.js        - 48팀 + 경기 일정
  utils/rankings.js           - 순위 계산
  components/
    GroupTable.jsx            - 조 순위표
    ThirdPlaceTable.jsx       - 3위팀 비교
    DrawSimulator.jsx         - 조추첨 시뮬레이터
cache/                        - API 응답 캐시 (gitignored)
logs/                         - 프로젝트 문서
```

## Environment Variables (.env)
```bash
RAPIDAPI_KEY=ea680f9e5203c0efe930df2c1b9e6be8
RAPIDAPI_HOST=v3.football.api-sports.io
WORLD_CUP_LEAGUE_ID=1
WORLD_CUP_SEASON=2026
DATABASE_URL=postgresql://juni@localhost:5432/groupstages_2026?sslmode=disable
API_PORT=3001
```

## Known Issues
- **미매핑 팀**: CUW (5530), CPV (1533) - 6개 경기 동기화 실패
- **카드 데이터**: 아직 영속성 없음 (team_statistics API 필요)

## Next Steps
1. 카드 데이터 API 엔드포인트 추가
2. 미매핑 팀 해결
3. 동기화 UI (Admin 페이지)

## GitHub
- Repository: https://github.com/JrJuni/groupstages.git
- Branch: main
