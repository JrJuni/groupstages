# CLAUDE.md

## Quick Start
```bash
npm run dev          # API(3001) + Vite(5000) 동시 실행
npm run dev:vite     # Vite만 (API 없이 로컬 모드)
npm run build        # 프로덕션 빌드 (0 warnings expected)
```

## 배포
```bash
# 프론트엔드 (Cloudflare Pages)
VITE_API_URL=https://groupstages-api.behomely0409.workers.dev npm run build
npx wrangler pages deploy dist --project-name groupstages --branch main

# Workers API
npx wrangler deploy
```
- **프로덕션**: https://groupstages.com/wc2026/
- **Workers API**: https://groupstages-api.behomely0409.workers.dev
- Git push ≠ 자동배포 (수동 wrangler 배포)

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + React Router 7
- **Backend (로컬)**: Node.js + Express (ESM) — port 3001 + PostgreSQL
- **Backend (프로덕션)**: Cloudflare Workers + D1 (SQLite)
- **External API**: API-Football (api-football.com, `x-apisports-key`) — 7,500 req/day
- **Cron Sync**: Workers `*/5 * * * *` → API-Football → D1 배치 UPDATE

## DO NOT
- `engine/`에서 `leagues/`, `utils/` import 금지 → 순수 파라미터 주입만
- 컴포넌트에서 `calculateStandings` 등 직접 호출 금지 → App 레벨 useMemo → props
- `team.name` 직접 렌더링 금지 → `useTeamName()` 훅 사용
- App.jsx와 TestApp.jsx 계산 로직 중복 금지 → 동일 함수(utils/) 사용
- MATCH_SCHEDULE/결과 데이터 키를 엔진 ID와 대조 없이 교체 금지 → 양방향 lookup 또는 키 정규화 필수 (출처: lessons-learned.md#match-schedule-키-방향-불일치)
- Workers cron 핸들러에 외부 fetch 추가 금지 (syncForm 현재 48/50 buffer 2) → 새 작업은 별도 cron으로 분리, D1 binding은 안전 (출처: docs/deploy.md#workers-무료-티어-50-subrequest-한도)
- CLAUDE.md 80줄 초과 금지 → docs/로 분리

## Workers Secrets
```bash
npx wrangler secret put API_FOOTBALL_KEY   # api-football.com 키
npx wrangler secret put SYNC_SECRET        # 수동 sync 인증용
```

## Known Issues
- ~~Workers에 ELO sync 미포팅~~ → Phase 5 (`workers/elo.js` + `workers/form.js`, `0 */6 * * *` cron)
- ~~시나리오 가중치에 ELO 미반영~~ → Phase 1~5 (`matchPredictor.js` + `usePredictor` 훅)
- ~~카드 데이터 영속성~~ → Workers Cron Sync로 해결
- DrawSimulator가 leagues/ 직접 import (props 패턴으로 전환 예정)
- App.jsx UI 문자열 일부 FIFA 하드코딩
- ~~D1 구형 플레이오프 placeholder ID~~ → 확정 팀 기반으로 교체 완료

## docs/ 인덱스

| 파일 | 설명 | 태그 |
|------|------|------|
| [architecture.md](docs/architecture.md) | Engine/League/Shim 구조, 데이터 흐름, 모듈 API | `#architecture` `#engine` `#data-flow` |
| [deploy.md](docs/deploy.md) | Cloudflare Pages/Workers/D1 배포, 시크릿, 캐시 정책 | `#deploy` `#cloudflare` `#d1` |
| [new-league-guide.md](docs/new-league-guide.md) | 새 리그 추가 가이드, LeagueConfig, API-Football | `#multi-league` `#api` `#schema` |
| [lessons-learned.md](docs/lessons-learned.md) | 실패 케이스 & 교훈 (렌더링, API, i18n, 배포) | `#failure` `#workaround` `#lesson` |
| [status.md](docs/status.md) | 로드맵 진행률, 다음 단계, 알려진 이슈 | `#status` `#roadmap` |
| [security-audit.md](docs/security-audit.md) | CORS, Origin 접근제어, 에러 마스킹 보안 감사 | `#security` `#audit` |

## GitHub
- https://github.com/JrJuni/groupstages.git (main branch)
