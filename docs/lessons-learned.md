# Lessons Learned — 실패 케이스 & 교훈

프로젝트에서 시도했다가 실패하거나 방향을 바꾼 케이스 모음.
새 기능/리그 추가 시 같은 실수를 반복하지 않기 위한 참고 자료.

---

## 렌더링 / UI

### html2canvas → html-to-image 교체
- **시도**: html2canvas로 순위표 이미지 저장
- **문제**: Tailwind CSS 클래스 + 커스텀 폰트 렌더링 깨짐, 배경색 누락
- **해결**: html-to-image (dom-to-image fork)로 교체 → 안정적 렌더링
- **교훈**: html2canvas는 복잡한 CSS (backdrop-blur, custom properties)에 약함

### 조별리그 표 오버플로우
- **시도**: 12조 그리드를 단순 flex로 배치
- **문제**: 모바일에서 테이블 오버플로우, 팀명 줄바꿈으로 레이아웃 깨짐
- **해결**: 반응형 grid (1/2/3 cols) + 테이블 내 텍스트 truncate
- **교훈**: 모바일 퍼스트로 테이블 설계, 컬럼 약어(W/D/L) 적극 활용

---

## 순위 계산 / 알고리즘

### 헤드투헤드 순환 문제 (A>B>C>A)
- **시도**: 단순 h2h 비교로 동점 해결
- **문제**: 3팀 이상 동점 시 A가 B를 이기고, B가 C를 이기고, C가 A를 이기는 순환 발생 → 무한루프
- **해결**: 재귀적 동점 그룹 해결 알고리즘 (한 팀이라도 분리되면 나머지로 재귀)
- **교훈**: FIFA 규정을 정확히 구현해야 함 — "3팀 이상 동점 시 상대전적 비교 후 일부만 분리되면 나머지에 대해 ④–⑥ 반복"

### 3위 판정 보수적 처리
- **시도**: 승점만으로 3위 진출확정/탈락확정 판정
- **한계**: 동점 시 GD/GF까지 비교하면 더 일찍 확정할 수 있지만, 현재는 보수적(>= 사용)
- **현재**: 의도적으로 보수적 유지 — 대회 중반 이후 GD/GF 정밀도 개선 예정
- **교훈**: 확정 판정은 틀리면 안 되므로, 보수적 시작 → 점진적 정밀화가 안전

---

## 데이터 수집

### MATCH_SCHEDULE 키 방향 불일치 (2회 발생)
- **시도**: API-Football에서 받은 fixture 데이터로 MATCH_SCHEDULE 키를 `홈_vs_어웨이` 형식으로 저장
- **문제**: `createInitialMatches()`는 팀 배열 인덱스 순서(i < j)로 ID 생성 (예: `MEX_vs_CZE`), API 데이터는 실제 FIFA 홈/어웨이 순서 (예: `CZE_vs_MEX`). lookup 실패 → matchday/date/venue 전부 null → MD3 통째 미표시, 일부 MD1/2도 1경기만 표시
- **해결**: `createInitialMatches`에서 양방향 lookup (`matchSchedule[id] || matchSchedule[altId]`)
- **교훈**: **엔진이 생성하는 매치 ID와 외부 데이터 소스의 키 형식이 다를 수 있음.** 일정/결과 데이터를 교체할 때 반드시 엔진의 ID 생성 로직(`teams[i]_vs_teams[j]`, i < j)과 대조 확인. 또는 lookup 자체를 양방향으로 설계하여 키 방향에 무관하게 동작하도록 할 것

### 3위 조합표 위키피디아 파싱
- **경위**: `KNOCKOUT_BRACKET`과 `THIRD_PLACE_GROUPS` 데이터를 위키피디아 `Template:2026_FIFA_World_Cup_third-place_table`에서 wikitext를 파싱하여 생성 (debug2/3.cjs → parse_thirds.cjs → gen_table.cjs 순으로 반복 시도)
- **결과**: 파싱 결과가 `src/leagues/worldcup2026/data.js`에 하드코딩됨. 스크립트는 일회성으로 삭제 완료

---

## API / 데이터

### RapidAPI vs API-Football 직접 인증
- **시도**: RapidAPI를 통한 API-Football 호출 (`x-rapidapi-key` 헤더)
- **문제**: 실제로는 api-football.com 직접 계정 사용 중 → 헤더가 `x-apisports-key`
- **해결**: Workers sync에서 `x-apisports-key`로 수정
- **교훈**: API-Football은 RapidAPI 경유 / 직접 접근 두 가지가 있음. 헤더가 다름

### team_mapping D1 누락
- **시도**: Workers Cron Sync 배포 후 자동 동기화 기대
- **문제**: D1에 team_mapping 테이블은 있지만 데이터 0건 → 모든 경기 스킵
- **해결**: `scripts/team_mapping.json` + `insert_team_mapping.sql` 기반으로 D1에 수동 insert
- **교훈**: D1 스키마만 있으면 안 됨, 시드 데이터도 배포 체크리스트에 포함해야 함

### D1 로컬 vs 리모트 혼동
- **시도**: `wrangler d1 execute groupstages --command "..."` 로 데이터 확인
- **문제**: `--remote` 플래그 없으면 로컬 SQLite를 조회 → "table not found"
- **해결**: 프로덕션 D1은 반드시 `--remote` 필요
- **교훈**: wrangler d1 명령은 기본이 로컬, `--remote` 붙여야 프로덕션

### wrangler secret 이름 실수
- **시도**: `npx wrangler secret put "actual-key-value"` (키 값을 이름으로 입력)
- **문제**: secret 이름이 API 키 값 자체가 되어버림
- **해결**: `wrangler secret delete "..."` 후 올바른 이름으로 재등록
- **교훈**: `wrangler secret put {NAME}` 형식, 값은 프롬프트에서 입력

---

## i18n / 번역

### Draw 탭 팀명 한국어 하드코딩
- **시도**: DrawSimulator에서 DRAW_POTS 직접 import → `team.name` 렌더링
- **문제**: DRAW_POTS의 name이 한국어 → 언어 전환해도 한국어로 표시
- **해결**: `useTeamName()` 훅으로 `teamName(team)` 사용 (i18n teams.json 조회)
- **교훈**: 모든 팀명 렌더링은 `useTeamName()` 훅 사용 필수. `team.name` 직접 사용 금지

### 번역 품질 — 공통 이슈 패턴
- **ZH**: `第X` → `第X名` (명 접미사 누락 — 11곳). 중국어 순위 표현에 명은 필수
- **ES**: 영어 약어 혼입 (`Grp` → `Gpo`), 서수 `º` 누락, `jornadas` ≠ `partidos` 오역
- **JA**: `節 {{md}}` → `第{{md}}節` (문법 어순 오류), `間接退場` 비표준 축구 용어
- **EN**: "탈락" 번역 불일치 — "Out"/"Eliminated"/"(eliminated)" 3곳에서 다름
- **교훈**: 네임스페이스 간 용어 일관성 검수 필수. 특히 share vs tables vs scenario

---

## 배포 / 인프라

### Cloudflare Pages + Workers 분리 구조
- **시도**: 프론트엔드와 API를 동일 Workers에서 서빙
- **문제**: Pages와 Workers는 별도 프로젝트 — Pages는 정적 파일, Workers는 API
- **해결**: Pages (dist/) + Workers (workers/index.js) 분리 배포
- **교훈**: `npx wrangler pages deploy`와 `npx wrangler deploy`는 다른 프로젝트에 배포됨

### CDN 캐시로 인한 빈 페이지
- **시도**: Cloudflare Pages에 새 빌드 배포 (JS 번들 해시 변경)
- **문제**: 일부 사용자 브라우저에 이전 `index.html`이 CDN 캐시 → 구 JS 번들 참조 → 404 → 빈 페이지 (제목만 표시)
- **해결**: `public/_headers`에 `index.html` + `/wc2026/` 경로에 `Cache-Control: no-cache` 설정
- **교훈**: SPA에서 `index.html`은 항상 `no-cache`. JS/CSS는 해시 파일명이라 장기 캐시 안전

### D1 구형 플레이오프 placeholder ID
- **시도**: 조추첨 확정 전에 `KOR_vs_UEFA_PO_D` 같은 placeholder ID로 DB 레코드 생성
- **문제**: 플레이오프 확정 후 팀 ID가 바뀌었지만(UEFA_PO_D → CZE) DB 레코드는 업데이트 안 됨 → Cron Sync가 매칭 실패 → 6개 조(A,B,D,F,I,K)의 18경기 누락
- **해결**: placeholder 레코드 삭제 + 확정 팀 기준 재생성
- **교훈**: DB에 미확정 팀 ID를 넣으면 확정 시 마이그레이션 필요. 팀 확정 전에는 DB 레코드 생성을 피하거나 마이그레이션 스크립트를 준비할 것

### Git push ≠ 자동배포
- **현재**: GitHub 연동 없이 수동 wrangler 배포
- **교훈**: 커밋 후 배포를 잊기 쉬움 — 배포 체크리스트 또는 CI/CD 설정 권장

### 빌드 산출물 폴더가 git에 커밋된 사례 (dist-deploy/)
- **경위**: `.gitignore`에는 `dist/`만 등록되어 있고 `dist-deploy/`는 누락 → 과거 배포 스냅샷 ~50 파일, 345K가 레포에 그대로 커밋되어 있었음
- **해결**: `git rm -r dist-deploy/` + `.gitignore`에 `dist-deploy/`, `attached_assets/` 추가
- **교훈**: 빌드/배포 중간 산출물 폴더는 **이름 변형까지 고려해 .gitignore에 방어적으로 등록**. `dist`, `dist-*`, `build`, `out` 등 변형 패턴을 주기적으로 감사할 것

---

## UI / UX

### 테이블 칼럼 축소 시 공백 의존 금지 (자동 레이아웃 함정)
- **시도**: 3위 테이블에서 `thirds.status.likely` ("진출 유력") 제거 후 상태 칼럼이 시각적으로 좁아짐
- **문제**: `<table>`이 auto layout이라 상태 셀이 대부분 비어있는 행에서는 칼럼 폭을 헤더("상태") 기준으로 축소 → 일부 행의 "진출 확정"/"탈락 확정" 뱃지가 칸에 꽉 차거나 줄바꿈 위험
- **해결**: 상태 `<th>`에 `min-w-[88px]` + `whitespace-nowrap`, 뱃지 span에도 `whitespace-nowrap` 적용
- **교훈**: 자동 레이아웃 테이블에서 "가끔만 채워지는" 칼럼은 **최소 폭을 명시**해야 안정적. 내용 삭제 후 칼럼 좁아지는 현상을 항상 체크
