# 📊 current_status.md — 프로젝트 공유 대시보드

> **마지막 업데이트**: 2026-04-03

---

## 전체 로드맵 진행률

```
Phase 1:  조별리그 대시보드        ✅ 완료
Phase 2:  경우의 수 탭             ✅ 완료 (브루트포스 시나리오 엔진)
Phase 3:  3위팀 순위               ✅ 완료 (승점 범위 + 진출확정/탈락확정 + 다음 경기)
Phase 4:  조추첨 시뮬레이터        ✅ 완료
Phase 5:  규칙 페이지              ✅ 완료
Phase 6:  경기 일정 정렬           ✅ 완료
Phase 7:  API-Football 연동        ✅ 완료 (72/72 동기화, 48팀 매핑)
Phase 8:  Cloudflare 배포          ✅ 완료 (Pages + Workers + D1)
Phase 9:  시나리오 엔진 고도화     ✅ 완료 (조건 텍스트, 혼조 분석, 배지 로직)
Phase 10: ELO 캐시 시스템          ✅ 완료 (eloratings.net 기반)
Phase 11: 세션 유지                ✅ 완료 (탭 + 시나리오 선택 localStorage)
Phase 12: 공유 기능 확장           ✅ 완료 (ScenarioPage ShareButtons)
Phase 12.5: 보안 패치              ✅ 완료 (CORS + Origin 접근제어 + 에러 마스킹)
Phase 13: SEO / AdSense 최적화    ⬜ 다음 단계
Phase 14: 랜딩 페이지             ⬜ 다음 단계
```

---

## 현재 활성 태스크

없음 (대기 중)

---

## 최근 완료된 작업 (2026-04-03)

### 플레이오프 확정팀 업데이트 (2026-04-03)
- **6개 플레이오프 슬롯 → 확정팀 교체**: UEFA_PO_D→CZE, UEFA_PO_A→BIH, UEFA_PO_C→TUR, UEFA_PO_B→SWE, IC_PO_1→COD, IC_PO_2→IRQ
- **수정 파일**: `src/data/worldcup2026.js` (INITIAL_GROUPS, DRAW_POTS, MATCH_SCHEDULE, FIFA_RANKINGS), `src/data/mockResults.js`, `scripts/generateTeamMapping.js`
- **FIFA 랭킹**: 추정값 적용 (SWE:25/26, TUR:28/30, CZE:43/45, BIH:55/56, IRQ:56/57, COD:63/64)

### 국기 이미지 추가 (2026-04-03)
- **6개 국기 PNG 다운로드**: flagcdn.com/w80 (기존과 동일 소스/포맷)
- `public/flags/` → cz.png, ba.png, tr.png, se.png, cd.png, iq.png
- `worldcup2026.js` 12곳 `flagImg: null` → 실제 경로로 수정

### 로컬 개발환경 세팅 (2026-04-03, 새 Windows PC)
- PostgreSQL 17 설치 + trust 인증 설정
- DB `groupstages_2026` 생성, 스키마 적용 (match_results, team_mapping, team_statistics, api_sync_log)
- 48팀 API-Football 매핑 완료 (BIH/CUW/CPV 수동 매핑)
- 72 fixtures 동기화 (전부 NS 상태)
- dotenvx 암호화 환경변수 구성

### 프로덕션 배포 (2026-04-03)
- Cloudflare Pages 배포 (국기 이미지 + 확정팀 반영)

---

## 이전 완료된 작업 (2026-03-19 ~ 03-24)

### 보안 패치 (2026-03-24)
- **CORS 화이트리스트**: `*` → `groupstages.com` + localhost만 허용
- **Origin 기반 접근제어**: POST/DELETE 요청은 허용된 Origin에서만 가능 (403 차단)
- **에러 메시지 마스킹**: DB 정보 노출 방지 (`Internal server error`)
- **ADMIN_TOKEN 번들 노출 제거**: 프론트엔드에서 토큰 완전 제거, Origin 검증으로 대체
- 상세: `logs/security_audit_2026_03_24.md`

### 경우의 수 탭 — 조건 텍스트 & 혼조 분석
- **순위별 조건 표시**: "1위: 대한민국 승 & 다른 경기 무승부" 형태
- **혼조 셀 분석**: `ptsAdjCount`로 승점 동률 경쟁팀 추적 → 득실차/다득점 조건 표시
- **WDL 색상 하이라이트**: W=emerald, D=yellow, L=red
- **팀명 사용**: "내" → 선택한 팀의 실제 이름

### 배지 로직 개선
- **진출 확정**: `topTwoProbability === 100%` 일 때만
- **진출 유력**: MD3 시작 전(스코어 미입력) + 승점 4 이상
- **3위 테이블**: ptsMax 기반 진출확정/탈락확정 판정

### 3위 테이블 업데이트
- **다음 경기 컬럼**: 국기 + 나라명, 3경기 완료 시 공란
- **상태 표시**: 진출 확정(green) / 탈락 확정(red) / 진출 유력(sky)

### ELO 캐시 시스템
- **소스**: eloratings.net/World.tsv (api-football에 ELO 엔드포인트 없음)
- **캐시**: `cache/elo_worldcup_2026.json` — 44팀 매핑 (42 실팀 + NGA, DEN)
- **엔드포인트**: `POST /api/sync/elo` (하루 10회), `GET /api/elo`
- **코드 매핑**: eloratings.net 독자 2자리 코드 → 우리 팀 ID (서버 하드코딩)

### 세션 유지 (localStorage)
- `gs_activeTab`: 탭 새로고침 유지
- `gs_scenarioGroup`, `gs_scenarioTeam`: 시나리오 선택 유지
- 경우의 수 탭 직접 클릭 시 그룹/팀 초기화

### 공유 기능 확장
- ScenarioPage: 순위표 옆 + 팀 패널 헤더에 ShareButtons 추가
- Reddit MD / HTML / 이미지 저장

### Cloudflare 배포 정비
- `_redirects` 복구: `/wc2026/* /:splat 200` (Vite base path 매핑 필수)
- 배포 절차 CLAUDE.md에 기록

---

## 다음 단계 (Next Steps)

### 우선순위 HIGH
- [ ] **ELO 반영**: 스코어 가중치에 ELO 반영하여 시나리오 확률 정밀화
- [ ] **카드 데이터 영속성**: team_statistics API 엔드포인트 추가
- [ ] **Workers 동기화**: `server/` 신규 기능(ELO 등)을 `workers/index.js`에도 구현

### 우선순위 MEDIUM
- [ ] **랜딩 페이지**: groupstages.com 루트 페이지 디자인
- [ ] **동기화 UI**: Admin 페이지에서 수동 동기화 + Rate Limit 표시
- [ ] **SEO**: 메타태그, OG 이미지, sitemap.xml

### 우선순위 LOW
- [ ] **32팀 버전 (wc2022)**: 새 브랜치로 2022 월드컵 버전

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| ELO 미반영 (시나리오 가중치) | ⚠️ 인지됨 | 캐시 구축 완료, 가중치 적용은 미구현 |
| 3위 진출 커트라인 고정값 | ⚠️ 근사치 | `THIRD_PLACE_MIN_PTS = 4` 고정 |
| Workers에 ELO/sync 미구현 | ⚠️ 인지됨 | 로컬 Express 전용, Workers 포팅 필요 |

---

## 커밋 히스토리 (주요)

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-04-03 | — | 플레이오프 확정팀 6개 교체 + 국기 추가 + 로컬환경 세팅 + 배포 |
| 2026-03-24 | — | 보안 패치: CORS + Origin 접근제어 + 에러 마스킹 |
| 2026-03-23 | `9e38143` | _redirects 복구 (루트 리다이렉트 제거) |
| 2026-03-23 | `77bd1d9` | 배포 구조 CLAUDE.md 기록 |
| 2026-03-19 | `9a262a6` | 경우의 수 개선, 3위 테이블, ELO 캐시, 세션 유지 |
| 2026-03-19 | `d583281` | 포아송 브루트포스 엔진 + 테스트 페이지 |
| 2026-03-17 | `b39ad7a` | DRAW_POTS FIFA 랭킹 기준 포트 재배정 |
| 2026-03-17 | `b57c669` | Cloudflare 풀스택 아키텍처 (Workers + D1) |
