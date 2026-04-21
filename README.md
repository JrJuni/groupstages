# GroupStages - 2026 FIFA World Cup Calculator

> Live: [groupstages.com](https://groupstages.com/)

2026 FIFA 월드컵 조별리그 순위 계산기. 48팀 12개 조의 경우의 수를 포아송 가중 브루트포스로 분석하고, 실시간 경기 결과를 반영합니다.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        groupstages.com                         │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│   Cloudflare Pages         │   Cloudflare Workers               │
│   (Frontend)               │   (API)                            │
│                            │                                    │
│   React 18 + Vite 5        │   workers/index.js                 │
│   Tailwind CSS 3           │     ├── GET  /api/matches          │
│   html-to-image            │     ├── POST /api/matches          │
│                            │     ├── DELETE /api/matches/:id    │
│   ┌──────────────────┐     │     └── GET  /api/third-place      │
│   │ GroupTable        │     │                                    │
│   │ ScenarioPage      │     │   ┌──────────────┐                │
│   │ ThirdPlaceTable   │────▶│   │ Cloudflare   │                │
│   │ DrawSimulator     │ fetch   │ D1 (SQLite)  │                │
│   │ ShareButtons      │     │   └──────────────┘                │
│   └──────────────────┘     │                                    │
│                            │   Security:                        │
│   dist/ → Pages Deploy     │   ├── Origin whitelist (CORS)      │
│                            │   ├── POST/DELETE origin check     │
│                            │   └── Generic error responses      │
├────────────────────────────┴────────────────────────────────────┤
│                                                                 │
│   Local Development                                             │
│                                                                 │
│   Express + PostgreSQL ──── Vite Dev Server (proxy /api)        │
│   port 3001                 port 5000                           │
│                                                                 │
│   API-Football (RapidAPI) ──── 54 fixtures sync                 │
│   eloratings.net ──────────── ELO cache (JSON)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Group Standings** - FIFA 공식 타이브레이커 (승점 → 득실차 → 다득점 → 헤드투헤드)
- **Scenario Engine** - 포아송 가중 (lambda=1.4) 브루트포스 6,561 조합 분석
- **Third Place Table** - 12개 조 3위팀 상위 8팀 자동 판정 (진출확정/탈락확정)
- **Draw Simulator** - Pot 1-4 조추첨 시뮬레이터 (지리적 제약조건 반영)
- **Live Sync** - API-Football 연동 (54경기 실시간 동기화)
- **ELO Ratings** - eloratings.net 기반 42팀 레이팅 캐시
- **Share** - Reddit Markdown, HTML 표, 이미지 저장

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Production API | Cloudflare Workers |
| Production DB | Cloudflare D1 (SQLite) |
| Local API | Node.js + Express (ESM) |
| Local DB | PostgreSQL |
| External API | API-Football (RapidAPI) |
| Hosting | Cloudflare Pages |
| AI Tooling | Claude Code (Opus 4.6), OpenClaw Agent |

## Quick Start

```bash
# Install
npm install

# Development (API + Vite concurrent)
npm run dev

# Production build
VITE_API_URL=https://your-worker.workers.dev npm run build

# Deploy
npx wrangler deploy                                          # Workers API
npx wrangler pages deploy dist --project-name groupstages    # Frontend
```

## Project Structure

```
src/
  components/        # React UI (GroupTable, ScenarioPage, DrawSimulator, ...)
  hooks/             # API hooks (useMatches, useTestMatches)
  utils/             # Rankings calculator, Scenario engine
  data/              # 48 teams + match schedule
workers/
  index.js           # Cloudflare Workers API (D1)
server/
  index.js           # Local Express API (PostgreSQL)
  routes/            # Sync routes (API-Football, ELO)
  services/          # API wrappers, caching
```

## Security

- CORS origin whitelist (no wildcard)
- POST/DELETE restricted to allowed origins (403 for others)
- Generic error responses (no DB info leak)
- Encrypted env vars (dotenvx)
- No secrets in frontend bundle

## License

MIT
