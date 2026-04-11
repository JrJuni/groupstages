# Deployment Guide

Cloudflare Pages (프론트엔드) + Workers (API) + D1 (DB) 풀스택 구조.

## 아키텍처

```
[사용자]
   ↓
[Cloudflare CDN (엣지)]
   ↓
┌──────────────────────────────────────┐
│ groupstages.com/wc2026/              │
│ Cloudflare Pages                     │
│  - Vite 빌드 결과 (dist/)            │
│  - React SPA                         │
└──────────────────────────────────────┘
   ↓ /api/*
┌──────────────────────────────────────┐
│ groupstages-api.workers.dev          │
│ Cloudflare Workers                   │
│  - workers/index.js (API 엔드포인트) │
│  - workers/sync.js (API-Football)    │
│  - Cron: */5 * * * * (fixtures sync) │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Cloudflare D1 (SQLite)               │
│  - match_results                     │
│  - team_mapping                      │
│  - team_statistics                   │
└──────────────────────────────────────┘
```

- **Pages URL**: https://groupstages.com/wc2026/
- **Workers API**: https://groupstages-api.behomely0409.workers.dev
- **라우팅**: `public/_routes.json`이 `/api/*`를 제외한 모든 요청을 Pages로 보냄
- Git push ≠ 자동배포 (수동 wrangler 배포)

## 배포 명령

### 프론트엔드 (Cloudflare Pages)
```bash
VITE_API_URL=https://groupstages-api.behomely0409.workers.dev npm run build
npx wrangler pages deploy dist --project-name groupstages --branch main
```

### Workers API
```bash
npx wrangler deploy
```

## 초기 설정 (신규 환경 기준)

### 1. Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. D1 데이터베이스 생성
```bash
wrangler d1 create groupstages
```

출력된 `database_id`를 `wrangler.toml`에 붙여넣기:
```toml
[[d1_databases]]
binding = "DB"
database_name = "groupstages"
database_id = "<your-id>"
```

### 3. 스키마 초기화
```bash
wrangler d1 execute groupstages --remote --file=./workers/schema.sql
```

> ⚠️ `--remote` 플래그 없으면 로컬 SQLite에 실행됨. 프로덕션은 반드시 `--remote`.

### 4. 초기 데이터 시드
```bash
# team_mapping 48팀
wrangler d1 execute groupstages --remote --file=./scripts/insert_team_mapping.sql
```

### 5. Workers Secrets
```bash
npx wrangler secret put API_FOOTBALL_KEY   # api-football.com 키 (x-apisports-key)
npx wrangler secret put SYNC_SECRET        # 수동 sync 인증용
```

> ⚠️ `wrangler secret put <NAME>` — 이름만 인자로, 값은 프롬프트에서 입력. 값을 인자로 넣으면 그게 이름이 되어버림.

### 6. Custom Domain 연결
1. Cloudflare Dashboard → Pages → groupstages → Custom domains
2. `groupstages.com` 추가
3. DNS는 Cloudflare가 자동 설정

## Vite 빌드 설정

- **base path**: `/wc2026/` (vite.config.js)
- **output**: `dist/`
- **경고 0건 기대** — 경고 있으면 배포 전 수정

## 캐시 정책

`public/_headers` 참조:
```
/index.html
  Cache-Control: no-cache
/wc2026/
  Cache-Control: no-cache
```

JS/CSS 번들은 해시 파일명이라 장기 캐시 안전. **index.html은 항상 no-cache** (이것 안 하면 CDN에 캐시된 구 index.html이 삭제된 JS 번들 참조 → 404 → 빈 페이지).

## D1 쿼리 디버깅

```bash
# 프로덕션 D1
wrangler d1 execute groupstages --remote --command="SELECT COUNT(*) FROM match_results"

# 로컬 D1 (dev용)
wrangler d1 execute groupstages --command="..."
```

## API-Football Cron Sync

`wrangler.toml`:
```toml
[triggers]
crons = ["*/5 * * * *"]
```

- 5분마다 `workers/index.js`의 scheduled handler 호출
- `workers/sync.js`가 API-Football에서 fixtures/cards 가져와 D1 batch UPDATE
- 수동 트리거: `curl -H "Authorization: Bearer $SYNC_SECRET" https://.../api/sync/fixtures`

## 비용

| 항목 | 한도 | 비용 |
|------|------|------|
| Pages | 무제한 정적 | 무료 |
| Workers | 100k 요청/일 | 무료 |
| D1 | 100만 행 읽기/일 | 무료 |
| Cron | 분 단위 | 무료 |
| Custom Domain | groupstages.com | $10/년 |

## 배포 체크리스트

- [ ] `npm run build` — 0 warnings
- [ ] `npx wrangler pages deploy dist ...`
- [ ] `npx wrangler deploy` (Workers 변경 시)
- [ ] `wrangler d1 execute ... --remote` (스키마 변경 시)
- [ ] Cron 로그 확인: `wrangler tail`
- [ ] 프로덕션 접속 확인 (여러 브라우저 — CDN 캐시 주의)
- [ ] `/api/matches` 응답 확인

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 빈 페이지 (제목만) | CDN이 구 index.html 캐시 | `_headers`에 no-cache 설정 확인, Ctrl+F5 |
| `/api/matches` 빈 배열 | team_mapping 미시드 | `insert_team_mapping.sql` 재실행 |
| `x-apisports-key` 401 | 시크릿 이름 오타 | `wrangler secret list`로 확인 후 재등록 |
| D1 "table not found" | `--remote` 누락 | 리모트는 반드시 `--remote` |
| 배포 후에도 구 버전 | 브라우저 디스크 캐시 | 하드 리로드 or 시크릿 창 |
