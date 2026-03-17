# 📊 current_status.md — 프로젝트 공유 대시보드

> **마지막 업데이트**: 2026-03-17
> **업데이트 규칙**: 모든 에이전트는 작업 완료 후 반드시 이 파일을 갱신하고 커밋한다

---

## 전체 로드맵 진행률

```
[███████████████░░░░░] 75%

Phase 1: 조별리그 대시보드      ✅ 완료
Phase 2: 경우의 수 탭           ✅ 완료
Phase 3: 3위팀 순위             ✅ 완료
Phase 4: 조추첨 시뮬레이터      ✅ 완료
Phase 5: 규칙 페이지            ✅ 완료
Phase 6: 경기 일정 정렬         ✅ 완료 (2026-03-17)
Phase 7: API-Football 연동      ✅ 완료 (2026-03-17)
Phase 8: 실제 배포 (도메인)     ⬜ 미시작
Phase 9: SEO / AdSense 최적화   ⬜ 미시작
```

---

## 현재 활성 태스크

없음 (대기 중)

---

## 최근 완료된 작업 (2026-03-17)

### [DONE] 보안 강화 및 .env 암호화 (최신)
- **dotenvx 적용**: .env 파일 전체 암호화 (7개 환경 변수)
- **API 키 재발급**: GitHub 노출로 인한 새 키 발급 및 적용
- **복호화 키 보호**: .env.keys를 .gitignore에 추가
- **서버 설정**: package.json 스크립트에 dotenvx 적용

### [DONE] API-Football 완전 연동 + JSON 캐싱 시스템
- **API-Football 연동**: RapidAPI 키 연동, World Cup 2026 데이터 동기화
- **팀 매핑**: 42/42팀 완전 매핑 (CUW, CPV 추가 완료)
- **경기 동기화**: 54/54 경기 100% 성공 (양방향 매칭 구현)
- **JSON 캐싱**: Rate Limit 절약용 파일 기반 캐시 (1시간 TTL)
  - 첫 동기화: 550ms (API 호출)
  - 이후 동기화: 167ms (캐시 사용)
- **신규 서비스**: `apiFootballService.js`, `cacheService.js`
- **신규 라우트**: `/api/sync/fixtures`, `/api/sync/card-statistics/:fixtureId`, `/api/sync/status`
- **신규 스크립트**: `generateTeamMapping.js`, `seedMatches.js`

### [DONE] 경기 일정 날짜순 정렬 + 실제 2026 WC 일정 데이터
- `MATCH_SCHEDULE` 상수 추가: 72경기 전체 UTC 날짜/경기장/도시
- `createInitialMatches`: matchday, date, venue, city 필드 연동
- `ScenarioPage`: `MatchList` 컴포넌트 → 날짜순 정렬 + 경기일 구분 헤더 + KST 날짜 표시
- DB 스키마: `matchday`, `match_date`, `status`, `fixture_id` 컬럼 추가
- 기존 48개 레코드에 실제 날짜 / matchday / status='FT' 업데이트

### [DONE] 3위팀 순위 탭 수정
- `played > 0` 필터 제거 → 경기 전에도 12팀 모두 표시
- `TEAM_SEEDS` 최종 타이브레이커 → 시드순 안정 정렬

### [DONE] 경우의 수 탭 신설
- 12개 조 선택 그리드 + 순위표 + 경기 일정·결과 입력
- GroupTable에서 클릭 시 해당 조로 자동 이동 (`navigateToScenario`)

---

## 다음 단계 (Next Steps)

### 우선순위 HIGH
- [ ] **카드 데이터 영속성**: team_statistics API 엔드포인트 추가 (1-2시간)
- [x] **미매핑 팀 해결**: CUW(5530), CPV(1533) API ID 확인 및 매핑 추가 ✅ 완료
- [ ] **동기화 UI**: Admin 페이지에서 수동 동기화 버튼 + Rate Limit 표시

### 우선순위 MEDIUM
- [ ] **경우의 수 분석 고도화**: 각 팀별 16강 진출 확률 계산기
- [ ] **자동 동기화**: Cron job 또는 WebSocket 실시간 업데이트
- [ ] **실제 경기 일정 데이터 완성**: 나머지 24경기(R1 일부, R3 전체) 날짜 정확도 검증

### 우선순위 LOW
- [ ] **배포**: Cloudflare Pages (프론트) + 별도 API 서버 (백엔드)
- [ ] **SEO**: 메타태그, OG 이미지, sitemap.xml

---

## 알려진 이슈 / 블로커

| 이슈 | 상태 | 비고 |
|------|------|------|
| 테스트 데이터 라운드 불일치 | ⚠️ 무시 가능 | 6개 조(B, C, E, F, H, K)의 테스트 점수가 실제 라운드와 다름. 실제 데이터 입력 시 자동 해결 |
| `CAN_vs_UEFA_PO_A`, `CHE_vs_QAT` DB 미삽입 | ⚠️ 무시 가능 | 해당 경기는 MATCH_SCHEDULE에서 날짜 제공, 점수 없이 프론트에서 렌더링 |

---

## 커밋 히스토리 (주요)

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-03-17 | `cb0301c` | .env 암호화 + 새 API 키 적용 (보안 강화) |
| 2026-03-17 | `2809577` | claude.md에서 민감한 정보 제거 (보안 패치) |
| 2026-03-17 | `22d7b61` | API-Football 완전 연동 + JSON 캐싱 시스템 (54/54 동기화) |
| 2026-03-17 | `d548935` | 경기 일정 날짜순 정렬 + API-Football 호환 DB 스키마 |
| 2026-03-17 | `fd551c6` | 조별리그 대시보드 뷰 전환 + 경우의 수 탭 신설 |
| 이전 | `1e5eb0d` | 경우의 수·규칙 탭 추가 |
