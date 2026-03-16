# GroupStages - 2026 FIFA World Cup Calculator

## Project Overview
2026 FIFA 월드컵 조별리그 경우의 수 계산 및 조추첨 시뮬레이터 웹 애플리케이션.

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Backend**: Node.js + Express (ESM) - port 3001
- **Database**: PostgreSQL (Replit built-in) via `pg` driver
- **Icons**: Lucide React
- **Image Export**: html2canvas
- **Dev Process**: concurrently (API + Vite)

## Architecture
- Express REST API (`server/index.js`) serves `/api/*` endpoints on port 3001
- Vite dev server proxies `/api` → `localhost:3001`
- React frontend fetches/saves match results from/to PostgreSQL via API
- `src/hooks/useMatches.js` manages DB sync (graceful fallback to local mode)
- Hosted on Cloudflare Pages (planned; needs separate API deploy for DB)

## Database Schema
```sql
CREATE TABLE match_results (
  id VARCHAR(100) PRIMARY KEY,   -- e.g. "MEX_vs_KOR"
  group_key CHAR(1) NOT NULL,    -- "A"~"L"
  home_id VARCHAR(30) NOT NULL,
  away_id VARCHAR(30) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

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
  index.js             - Express API (matches CRUD + third-place query)
src/
  App.jsx              - 메인 앱 (탭 네비게이션, useMatches 훅 사용)
  main.jsx             - React 진입점
  index.css            - Tailwind + 글로벌 스타일
  hooks/
    useMatches.js      - API 연동 훅 (로드/저장/초기화)
  data/
    worldcup2026.js    - 48팀 데이터 (실제 2026 WC 조추첨), Pot 구성
  utils/
    rankings.js        - 순위 계산 알고리즘 (헤드투헤드 포함)
    draw.js            - 조추첨 로직 (feasibility 체크 포함)
  components/
    GroupTable.jsx     - 개별 조 순위표 + 경기 결과 입력
    ThirdPlaceTable.jsx - 3위팀 비교 테이블 (DB 상태 표시)
    DrawSimulator.jsx  - 조추첨 시뮬레이터 UI
    ShareButtons.jsx   - 공유 버튼 (MD/HTML/이미지)
public/
  flags/               - 42개국 국기 PNG 파일 (flagcdn.com)
```

## API Endpoints
- `GET  /api/matches`       - 모든 경기 결과 조회
- `POST /api/matches`       - 경기 결과 upsert
- `DELETE /api/matches/:id` - 특정 경기 초기화
- `DELETE /api/matches`     - 전체 초기화
- `GET  /api/third-place`   - DB에서 3위팀 집계 쿼리

## Running the App
```
npm run dev    # API(3001) + Vite(5000) 동시 실행
npm run build  # Cloudflare Pages 배포용 빌드
```

## GitHub Repository
- Remote: https://github.com/JrJuni/groupstages.git
- Branch: main
