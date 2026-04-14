# 프로젝트 로드맵 & 상태

> **마지막 업데이트**: 2026-04-14 (Phase 24.1 cron 분리 첫 발화 검증 완료)

## 로드맵 진행률

```
Phase 1:  조별리그 대시보드         ✅ 완료
Phase 2:  경우의 수 탭              ✅ 완료 (포아송 브루트포스 6,561 조합/조)
Phase 3:  3위팀 순위                ✅ 완료 (승점 범위 + 진출확정/탈락확정)
Phase 4:  조추첨 시뮬레이터         ✅ 완료 (FIFA 공식 룰)
Phase 5:  규칙 페이지               ✅ 완료
Phase 6:  경기 일정 정렬            ✅ 완료 (72경기)
Phase 7:  API-Football 연동         ✅ 완료 (48팀 매핑)
Phase 8:  Cloudflare 배포           ✅ 완료 (Pages + Workers + D1)
Phase 9:  시나리오 엔진 고도화      ✅ 완료 (조건 텍스트, 혼조 분석)
Phase 10: ELO 캐시 시스템           ✅ 완료 (eloratings.net 기반)
Phase 11: 세션 유지                 ✅ 완료 (localStorage)
Phase 12: 공유 기능 + 보안 패치     ✅ 완료 (CORS + Origin 접근제어)
Phase 13: 토너먼트 대진표 탭        ✅ 완료 (Engine/League 구조 분리)
Phase 14: 다국어(i18n) 지원         ✅ 완료 (ko/en/es/ja/zh 5개 언어)
Phase 15: 번역 품질 검수            ✅ 완료 (High 31건 수정)
Phase 16: Workers Cron Sync         ✅ 완료 (5분 주기 API-Football → D1)
Phase 17: 문서 체계 정리            ✅ 완료 (CLAUDE.md 슬림화 + docs/ 분리)
Phase 18: 카드 데이터 Cron Sync      ✅ 완료 (fixture_cards → team_statistics)
Phase 19: 시나리오 UX 개선           ✅ 완료 (FIFA 랭킹 표시 + 점수 수정 + localStorage)
Phase 20: 일정 데이터 자동 동기화     ✅ 완료 (venue/city D1 저장 + 양방향 매치 ID lookup)
Phase 21: 시간대 로컬화              ✅ 완료 (KST 고정 → 사용자 로컬 시간대 자동 표시)
Phase 22: CDN 캐시 안정화            ✅ 완료 (_headers no-cache + D1 구형 placeholder 정리)
Phase 23: 프로젝트 정리 & UI 폴리시   ✅ 완료 (스테일 파일 제거, 배포 문서 통합, 테이블 레이아웃 다듬기)
Phase 24: ELO 예측 엔진                ✅ 완료 (5단계 — matchPredictor + scenarioComputer + 폼 캐시 + usePredictor + Workers/D1 prod)
Phase 24.1: Workers cron 분리          ✅ 완료 (ELO/form 50 subrequest 한도 회피, 30분 offset)
```

### Phase 24 — ELO 예측 엔진 (요약)

매치별 ELO + 폼 기반 Poisson λ로 시나리오 81셀 가중치 그리드 생성. 5 sub-phase:

1. **순수 모듈** — `src/engine/matchPredictor.js` (`predictMatchLambdas`, `poissonWeights`, `buildPredictorFn`)
2. **scenarioComputer 통합** — `options.matchPredictor` 콜백 (predictor null이면 baseline GOAL_W로 fallback)
3. **폼 캐시** — `server/services/teamFormService.js` + `apiFootballService.getLastNFixtures` + dev `?predictor=off` 토글
4. **App 와이어링** — `usePredictor` 훅 (`/api/elo` + `/api/team-form` Promise.allSettled fetch) → ScenarioPage → TeamScenarioPanel
5. **Workers + D1 prod** — `workers/elo.js`, `workers/form.js`, `team_elo`/`team_form` 테이블, `0 */6 * * *` cron, X-Sync-Secret 인증

**Before/after 비교 (50K iter Monte Carlo, pre-tournament 균등 baseline 대비)**:
- ESP +49pp, ARG +47pp, CHE/MEX(host) +46pp, NED +44pp — 강팀 의도 boost
- 약팀(unmapped 6팀 + 저ELO 5팀): -42 ~ -49pp
- 평균 |Δ| 33.8pp (※ pre-tournament 균등 baseline 대비. 매치데이 2~3에서는 훨씬 작음)
- L조 잉글랜드/크로아티아 prod 시각 확인 ✅
- 라이브 데이터: ELO 44 mapped / form 48 mapped, API 사용 ~47/7500 (0.6%)

## 다음 단계

### 우선순위 HIGH
- (없음 — 핵심 기능 모두 완료)

### 우선순위 MEDIUM
- [ ] DrawSimulator props 패턴 전환 (leagues/ 직접 import 제거)
- [ ] App.jsx FIFA 하드코딩 제거 (멀티리그 대비)
- [ ] **Workers CORS Origin 우회 개선** — `X-Sync-Secret` 헤더가 있으면 CORS 체크 스킵 (server-to-server 트리거 항상 막히는 문제. Phase 24 배포 시 발견 — Origin 헤더 spoof로 우회 가능. workers/index.js:64-71 참조)
- [ ] **ELO 매핑 5팀 누락 조사** — 매핑 49개 중 44 mapped. 누락 팀 확인 + `ELO_CODE_TO_TEAM_ID` 보완 (`workers/elo.js`, `server/services/eloService.js` 둘 다)

### 우선순위 LOW
- [ ] 랜딩 페이지 (groupstages.com 루트)
- [ ] SEO (메타태그, sitemap.xml)
- [ ] 다른 리그 확장 (Premier League 등)

### 장기 과제
- [ ] Chrome 확장 프로그램 — 미니 대시보드 (관심 조 순위 + 3위 상태), 본 사이트 유입용
- [ ] 실시간 중계 페이지 — Durable Objects + WebSocket 필요, 인프라 비용 고려
- [ ] 채팅/커뮤니티 — 모더레이션 운영 부담 큼, 커뮤니티 형성 후 검토

## 알려진 이슈

| 이슈 | 상태 |
|------|------|
| ~~ELO 미반영 (시나리오 가중치)~~ | ✅ Phase 24로 해결 |
| ~~카드 데이터 영속성 없음~~ | ✅ Workers Cron Sync로 해결 (Phase 18) |
| DrawSimulator leagues/ 직접 import | ⚠️ props 전환 예정 |
| Workers CORS Origin 차단 (server-to-server) | ⚠️ Origin 헤더 spoof로 우회 가능. 로직 개선 예정 |
| ELO 매핑 5팀 누락 (49 → 44 mapped) | ⚠️ 미조사 |
| ~~Workers free tier subrequest 한도~~ | ✅ Phase 24.1 cron 분리로 해결 (각 cron 단독 invocation) |
