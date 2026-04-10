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

### Git push ≠ 자동배포
- **현재**: GitHub 연동 없이 수동 wrangler 배포
- **교훈**: 커밋 후 배포를 잊기 쉬움 — 배포 체크리스트 또는 CI/CD 설정 권장
