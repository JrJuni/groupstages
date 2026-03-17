# GroupStages - 2026 FIFA World Cup Calculator

## Project Overview
2026 FIFA 월드컵 조별리그 경우의 수 계산 및 조추첨 시뮬레이터 웹 애플리케이션.

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Backend**: Node.js + Express (ESM) - port 3001
- **Database**: PostgreSQL (로컬 또는 Replit) via `pg` driver
- **External API**: API-Football (RapidAPI) - 7500 requests/day
- **Caching**: JSON 파일 기반 (1시간 TTL)
- **Icons**: Lucide React
- **Image Export**: html2canvas
- **Dev Process**: concurrently (API + Vite)

## Architecture
- Express REST API (`server/index.js`) serves `/api/*` endpoints on port 3001
- Vite dev server proxies `/api` → `localhost:3001`
- React frontend fetches/saves match results from/to PostgreSQL via API
- `src/hooks/useMatches.js` manages DB sync (graceful fallback to local mode)
- API-Football 연동: `apiFootballService.js` + `cacheService.js`
- 양방향 경기 매칭: 홈/어웨이 순서 무관 (48/54 경기 동기화 성공)
- Hosted on Cloudflare Pages (planned; needs separate API deploy for DB)

## Database Schema
```sql
CREATE TABLE match_results (
  id         VARCHAR(100) PRIMARY KEY,  -- e.g. "MEX_vs_KOR"
  group_key  CHAR(1)      NOT NULL,     -- "A"~"L"
  home_id    VARCHAR(30)  NOT NULL,
  away_id    VARCHAR(30)  NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchday   SMALLINT,                  -- 1/2/3
  match_date TIMESTAMPTZ,               -- UTC 킥오프
  status     VARCHAR(10)  DEFAULT 'NS', -- NS/FT/1H/HT/2H
  fixture_id INTEGER,                   -- API-Football fixture.id
  updated_at TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE team_mapping (
  our_team_id   VARCHAR(30) PRIMARY KEY, -- e.g. "MEX"
  api_team_id   INTEGER NOT NULL UNIQUE, -- API-Football team ID
  api_team_name VARCHAR(100),
  api_team_code VARCHAR(10)
);

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

### API-Football (RapidAPI) 호환성 분석

**현재 구조와의 매핑:**
| 우리 필드         | API-Football 필드               | 비고                          |
|-------------------|---------------------------------|-------------------------------|
| `fixture_id`      | `fixture.id`                    | NULL → 연동 후 채움           |
| `match_date`      | `fixture.date` (ISO 8601 UTC)   | ✅ 동일 포맷                   |
| `status`          | `fixture.status.short`          | NS/FT/1H/HT/2H 등             |
| `matchday`        | `league.round` ("Group Stage - 1") → 숫자 추출 | 파싱 필요 |
| `home_score`      | `goals.home`                    | ✅ 직접 매핑                   |
| `away_score`      | `goals.away`                    | ✅ 직접 매핑                   |
| `home_id`/`away_id` | `teams.home.id` (정수)        | ⚠️ 별도 팀 ID 매핑 테이블 필요 |

**미래 연동 시 필요한 추가 작업:**
1. `team_mapping` 테이블: `our_id VARCHAR ↔ api_team_id INT`
2. `fixture_id`로 모든 72경기 레코드 사전 삽입 (현재 played=0 경기 포함)
3. API sync 시: `UPDATE match_results SET status='FT', home_score=..., away_score=... WHERE fixture_id=...`
4. `GET /api/matches?league=1&season=2026` → fixture_id NULL 레코드 조회 후 bulk upsert

## Key Features
1. **조별리그 순위 계산**: 12개 조, 48팀, 실시간 경기 결과 입력 (DB 자동 저장)
2. **FIFA 동점 처리**: 승점 → 득실차 → 다득점 → 헤드투헤드
3. **3위팀 상위 8팀**: DB 쿼리로 자동 집계 + 정렬 표시
4. **조추첨 시뮬레이터**: Pot 1-4 시스템, 지리적 제약조건, 애니메이션
5. **공유 기능**: Reddit Markdown, HTML 표 복사, 이미지 저장
6. **광고 레이아웃**: AdSense 슬롯 (상단/사이드/하단)
7. **국기 이미지**: 42개국 PNG 파일 (`public/flags/`)
8. **실제 2026 WC 조**: 2025-12-05 조추첨 결과 반영

## Project Structure
```
server/
  index.js                    - Express API (matches CRUD + third-place query)
  routes/
    syncRoutes.js             - API-Football 동기화 엔드포인트
  services/
    apiFootballService.js     - API-Football 래퍼 (캐싱 포함)
    cacheService.js           - JSON 파일 기반 캐시 (TTL 지원)
scripts/
  init_schema.sql             - PostgreSQL 스키마
  generateTeamMapping.js      - 팀 ID 자동 매핑
  seedMatches.js              - 경기 일정 seed
src/
  App.jsx                     - 메인 앱 (탭 네비게이션, useMatches 훅 사용)
  hooks/
    useMatches.js             - API 연동 훅 (로드/저장/초기화)
  data/
    worldcup2026.js           - 48팀 데이터 + MATCH_SCHEDULE
  utils/
    rankings.js               - 순위 계산 알고리즘 (헤드투헤드 포함)
    draw.js                   - 조추첨 로직 (feasibility 체크 포함)
  components/
    GroupTable.jsx            - 개별 조 순위표 + 경기 결과 입력
    ThirdPlaceTable.jsx       - 3위팀 비교 테이블 (DB 상태 표시)
    DrawSimulator.jsx         - 조추첨 시뮬레이터 UI
    ShareButtons.jsx          - 공유 버튼 (MD/HTML/이미지)
cache/                        - API 응답 캐시 (gitignored)
logs/                         - 프로젝트 문서 및 상태 추적
public/
  flags/                      - 42개국 국기 PNG 파일
```

## API Endpoints

### Match CRUD
- `GET  /api/matches`       - 모든 경기 결과 조회
- `POST /api/matches`       - 경기 결과 upsert
- `DELETE /api/matches/:id` - 특정 경기 초기화
- `DELETE /api/matches`     - 전체 초기화
- `GET  /api/third-place`   - DB에서 3위팀 집계 쿼리

### API-Football 동기화
- `POST /api/sync/fixtures`                  - 경기 일정/결과 동기화
- `POST /api/sync/card-statistics/:fixtureId` - 특정 경기 카드 통계 동기화
- `GET  /api/sync/status`                    - Rate Limit 및 동기화 이력 조회

## Running the App
```
npm run dev    # API(3001) + Vite(5000) 동시 실행
npm run build  # Cloudflare Pages 배포용 빌드
```

## GitHub Repository
- Remote: https://github.com/JrJuni/groupstages.git
- Branch: main
