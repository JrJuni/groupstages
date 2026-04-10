# 프로젝트 로드맵 & 상태

> **마지막 업데이트**: 2026-04-11

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
```

## 다음 단계

### 우선순위 HIGH
- [ ] ELO 기반 시나리오 가중치 정교화
- [x] ~~카드 데이터 자동 동기화~~ → Phase 18 완료
- [ ] 3위 확정 판정 정밀도 (동점 시 GD/GF 비교)

### 우선순위 MEDIUM
- [ ] DrawSimulator props 패턴 전환 (leagues/ 직접 import 제거)
- [ ] App.jsx FIFA 하드코딩 제거 (멀티리그 대비)
- [ ] Workers ELO sync 포팅

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
| ELO 미반영 (시나리오 가중치) | ⚠️ 캐시만 구축 |
| ~~카드 데이터 영속성 없음~~ | ✅ Workers Cron Sync로 해결 (Phase 18) |
| DrawSimulator leagues/ 직접 import | ⚠️ props 전환 예정 |
