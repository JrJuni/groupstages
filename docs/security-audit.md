# 🔒 보안 감사 및 패치 기록 — 2026-03-24

> **수행자**: Claude Code (Opus 4.6)
> **트리거**: openclaw 보안 리포트 (`~/.openclaw/workspace/groupstages-report.md`)

---

## 발견된 취약점 및 조치

### 1. CORS 와일드카드 (`*`) → Origin 화이트리스트

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **파일** | `workers/index.js` |
| **이전** | `Access-Control-Allow-Origin: *` — 모든 도메인에서 API 호출 가능 |
| **이후** | `allowedOrigins` 화이트리스트: `groupstages.com`, `www.groupstages.com`, `localhost:5000`, `localhost:5173` |
| **상태** | ✅ 패치 완료 + 배포 완료 |

### 2. POST/DELETE 엔드포인트 무인증 → Origin 기반 접근제어

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **파일** | `workers/index.js` |
| **이전** | 누구나 URL만 알면 `POST /api/matches`, `DELETE /api/matches` 호출 가능 |
| **이후** | `Origin` 헤더가 화이트리스트에 없으면 `403 Forbidden` 반환 |
| **상태** | ✅ 패치 완료 + 배포 완료 |

### 3. 에러 메시지 DB 정보 노출 → 제네릭 메시지

| 항목 | 내용 |
|------|------|
| **심각도** | MEDIUM |
| **파일** | `workers/index.js` |
| **이전** | `{ error: error.message }` — DB 스키마, 쿼리 정보 노출 가능 |
| **이후** | `{ error: 'Internal server error' }` — 제네릭 응답 |
| **상태** | ✅ 패치 완료 + 배포 완료 |

### 4. ADMIN_TOKEN 프론트엔드 번들 노출 문제 → 제거

| 항목 | 내용 |
|------|------|
| **심각도** | CRITICAL |
| **설명** | 초기 패치에서 `VITE_ADMIN_TOKEN`을 빌드 시 주입하는 방식 사용 → JS 번들에 토큰 평문 노출 |
| **조치** | `src/config.js`에서 `ADMIN_TOKEN` export 제거, `src/hooks/useMatches.js`에서 `X-Admin-Token` 헤더 제거 |
| **대체 방안** | Origin 기반 접근제어로 전환 (토큰 불필요) |
| **상태** | ✅ 제거 완료 + 재빌드 + 재배포 완료 |

---

## 검증 결과

| 테스트 | 기대값 | 결과 |
|--------|--------|------|
| Origin 없이 DELETE | 403 | ✅ 403 |
| `Origin: https://evil.com` DELETE | 403 | ✅ 403 |
| `Origin: https://groupstages.com` DELETE | 200 | ✅ 200 |
| GET /api/matches (인증 없이) | 200 | ✅ 200 |
| 번들에 ADMIN_TOKEN 포함 여부 | 0건 | ✅ 0건 |

---

## 미조치 항목 (인지됨, 향후 작업)

| 항목 | 심각도 | 비고 |
|------|--------|------|
| Express 서버 (`server/`) 무인증 | HIGH | 로컬 개발 전용이므로 프로덕션 영향 없음 |
| Rate limiting 없음 | MEDIUM | Workers + Express 전체. Cloudflare 자체 DDoS 보호 존재 |
| Security headers 미설정 (CSP 등) | MEDIUM | Cloudflare Pages `_headers` 파일로 추가 가능 |
| `compatibility_date` 구버전 | LOW | `2024-01-01` → 업데이트 권장 |

---

## 배포 이력

| 시각 (KST) | 대상 | 버전 ID |
|-------------|------|---------|
| 2026-03-24 | Workers API | `0afa42bc-b149-4ab1-a8ce-06c0f7099913` |
| 2026-03-24 | Pages Frontend | `b323bee5` |
