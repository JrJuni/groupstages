# GroupStages 배포 가이드

## 목차
1. [Cloudflare D1 데이터베이스 설정](#1-cloudflare-d1-데이터베이스-설정)
2. [Cloudflare Workers 배포](#2-cloudflare-workers-배포)
3. [Cloudflare Pages 배포](#3-cloudflare-pages-배포)
4. [도메인 연결](#4-도메인-연결)
5. [32팀 버전 배포](#5-32팀-버전-배포)

---

## 사전 준비

### 1. Wrangler CLI 설치
```bash
npm install -g wrangler
wrangler login
```

---

## 1. Cloudflare D1 데이터베이스 설정

### 1-1. D1 데이터베이스 생성
```bash
wrangler d1 create groupstages
```

출력 예시:
```
✅ Successfully created DB 'groupstages'!
binding = "DB"
database_name = "groupstages"
database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"
```

### 1-2. wrangler.toml 업데이트
`database_id`를 복사해서 `wrangler.toml` 파일에 붙여넣기:
```toml
[[d1_databases]]
binding = "DB"
database_name = "groupstages"
database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"  # 여기에 실제 ID
```

### 1-3. 스키마 초기화
```bash
wrangler d1 execute groupstages --file=./workers/schema.sql
```

### 1-4. 경기 일정 데이터 삽입
```bash
# PostgreSQL 데이터를 SQLite로 내보내기
psql postgresql://juni@localhost:5432/groupstages_2026 -c "\copy match_results TO 'match_data.csv' WITH CSV HEADER"

# D1에 삽입 (CSV 형식을 SQL INSERT로 변환 필요)
# 또는 scripts/seedMatches.js를 D1용으로 수정
```

### 1-5. 팀 매핑 데이터 삽입
```bash
# team_mapping 테이블 데이터도 동일하게 마이그레이션
```

---

## 2. Cloudflare Workers 배포

### 2-1. Secrets 설정
```bash
# API-Football 키
wrangler secret put RAPIDAPI_KEY
# 프롬프트에 키 입력: 8dc9afcbcfbbc24be183a09eac5c7424

wrangler secret put RAPIDAPI_HOST
# 입력: v3.football.api-sports.io
```

### 2-2. Workers 배포
```bash
wrangler deploy
```

출력 예시:
```
✨  Build succeeded!
✨  Publishing to Cloudflare...
✨  Success! Deployed to:
    https://groupstages-api.your-account.workers.dev
```

### 2-3. Workers 테스트
```bash
# 경기 데이터 조회
curl https://groupstages-api.your-account.workers.dev/api/matches

# 응답 예시:
# [{"id":"MEX_vs_RSA","group_key":"A",...}]
```

---

## 3. Cloudflare Pages 배포

### 3-1. GitHub 연결
1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → GitHub → `groupstages` 레포 선택
3. Production branch: `main`

### 3-2. 빌드 설정
```yaml
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (empty)

Environment variables:
  NODE_VERSION: 18
```

### 3-3. _routes.json 설정
Cloudflare Pages가 `/api/*` 요청을 Workers로 라우팅하도록:

`public/_routes.json` 파일 생성:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

이렇게 하면:
- `/wc2026/*` → Pages (React 앱)
- `/api/*` → Workers (API)

### 3-4. 배포 확인
```
https://groupstages.pages.dev/wc2026
```

---

## 4. 도메인 연결

### 4-1. Custom Domain 추가
1. Pages 프로젝트 → Custom domains
2. `groupstages.com` 추가
3. DNS 자동 설정 확인 (Cloudflare가 자동으로 설정)

### 4-2. 배포 URL
```
✅ https://groupstages.com/wc2026  (48팀 버전)
⏳ https://groupstages.com/wc2022  (32팀 버전 - 예정)
```

---

## 5. 32팀 버전 배포

### 5-1. wc2022 브랜치 생성
```bash
git checkout -b wc2022
```

### 5-2. 아키텍처 변경
- 조 수: 12개 → 8개 (A-H)
- 3위팀: 8팀 → 4팀
- `worldcup2026.js` → `worldcup2022.js`
- Vite base path: `/wc2022/`

### 5-3. Cloudflare Pages 프리뷰 배포
1. Pages 프로젝트 → Settings → Builds & deployments
2. Preview deployments → Enable for: `wc2022`
3. `wc2022` 브랜치 푸시하면 자동 배포

### 5-4. URL
```
https://groupstages.com/wc2022
```

---

## 배포 후 체크리스트

### 48팀 버전 (wc2026)
- [ ] https://groupstages.com/wc2026 접속 확인
- [ ] 경기 데이터 로드 확인 (54개 경기)
- [ ] 경기 결과 입력 → 순위표 업데이트
- [ ] 3위팀 상위 8팀 표시
- [ ] 조추첨 시뮬레이터 동작
- [ ] 모든 탭 정상 작동

### 32팀 버전 (wc2022)
- [ ] https://groupstages.com/wc2022 접속 확인
- [ ] 경기 데이터 48개 확인
- [ ] 3위팀 상위 4팀 표시
- [ ] 8개 조 (A-H) 정상 표시

---

## 비용 예상

```
Cloudflare Pages:    무료
Cloudflare Workers:  무료 (10만 요청/일)
Cloudflare D1:       무료 (100만 행 읽기/일)
도메인:              $10/년 (이미 구매)

총 비용: $0.83/월
```

---

## 문제 해결

### Workers 배포 오류
```bash
# 로컬 테스트
wrangler dev workers/index.js

# 로그 확인
wrangler tail
```

### D1 데이터 확인
```bash
# 쿼리 실행
wrangler d1 execute groupstages --command="SELECT COUNT(*) FROM match_results"
```

### Pages 빌드 실패
- `package.json`의 `build` 스크립트 확인
- Node 버전 18 이상 확인
- `vite.config.js`의 `base: '/wc2026/'` 확인
