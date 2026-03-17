# Cloudflare 풀스택 아키텍처

## 비용 분석 (월별)

### Cloudflare 통합 솔루션
```
✅ Cloudflare Pages (프론트엔드)       - 무료
✅ Cloudflare Workers (API 백엔드)    - 무료 (10만 요청/일)
✅ Cloudflare D1 (SQLite DB)          - 무료 (100만 행 읽기/일)
✅ Custom Domain (groupstages.com)    - $10/년 (이미 구매)

총 비용: $0.83/월 (도메인만)
```

### Railway 비교
```
❌ Railway Hobby                       - $5/월
❌ PostgreSQL                          - 포함
❌ Cloudflare Pages                    - 무료

총 비용: $5/월
```

**절감액: 연간 $50**

---

## 아키텍처 구조

```
[사용자]
   ↓
[Cloudflare CDN (전세계 엣지)]
   ↓
┌─────────────────────────────────┐
│  groupstages.com/wc2026         │
│  (Cloudflare Pages)             │
│  - React 앱                      │
│  - 정적 파일                     │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│  groupstages.com/api/*          │
│  (Cloudflare Workers)           │
│  - API 엔드포인트                │
│  - API-Football 연동             │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│  Cloudflare D1                  │
│  (SQLite 데이터베이스)           │
│  - match_results                │
│  - team_mapping                 │
│  - team_statistics              │
└─────────────────────────────────┘
```

---

## 기술 스택 변경

### 데이터베이스
- **Before**: PostgreSQL (pg 드라이버)
- **After**: Cloudflare D1 (SQLite)

### API 서버
- **Before**: Express.js (Node.js 서버)
- **After**: Cloudflare Workers (서버리스)

### 환경 변수
- **Before**: dotenvx + .env.keys
- **After**: Workers Secrets (Cloudflare Dashboard)

---

## 주요 차이점

### PostgreSQL vs D1 (SQLite)

**동일한 기능**:
- ✅ SQL 문법 대부분 호환
- ✅ Parameterized queries
- ✅ Transactions
- ✅ Indexes

**변경 필요**:
```sql
-- PostgreSQL
SERIAL PRIMARY KEY  →  INTEGER PRIMARY KEY AUTOINCREMENT

-- Date/Time 타입
TIMESTAMPTZ  →  TEXT (ISO 8601 문자열)

-- ON CONFLICT 문법 (거의 동일)
ON CONFLICT (id) DO UPDATE  →  동일
```

---

## 마이그레이션 단계

### 1단계: D1 데이터베이스 스키마 변환
```sql
-- PostgreSQL → D1 (SQLite)
CREATE TABLE match_results (
  id         TEXT PRIMARY KEY,           -- VARCHAR → TEXT
  group_key  TEXT NOT NULL,              -- CHAR(1) → TEXT
  home_id    TEXT NOT NULL,
  away_id    TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchday   INTEGER,                    -- SMALLINT → INTEGER
  match_date TEXT,                       -- TIMESTAMPTZ → TEXT
  status     TEXT DEFAULT 'NS',
  fixture_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))  -- TIMESTAMP → TEXT
);

-- 인덱스는 동일
CREATE INDEX idx_match_group ON match_results(group_key);
```

### 2단계: Express API → Workers 변환
```javascript
// Before (Express)
app.get('/api/matches', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM match_results');
  res.json(rows);
});

// After (Workers)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/matches') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM match_results'
      ).all();
      return Response.json(results);
    }
  }
}
```

### 3단계: 프론트엔드 (변경 없음!)
- React 코드 그대로 사용
- API 호출 경로 그대로 (`/api/*`)
- Cloudflare Pages가 자동으로 Workers로 라우팅

---

## 배포 설정

### wrangler.toml (Workers 설정)
```toml
name = "groupstages-api"
main = "workers/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "groupstages_db"
database_id = "your-db-id"

[vars]
RAPIDAPI_KEY = ""  # Workers Secret으로 관리
```

### Cloudflare Pages 설정
```yaml
Framework: Vite
Build command: npm run build
Build output: dist
Root directory: (empty)

Environment variables:
- NODE_VERSION: 18
```

---

## 성능 비교

| 항목 | Railway + PostgreSQL | Cloudflare 풀스택 |
|------|---------------------|-------------------|
| **API 응답 속도** | ~200ms (미국 서버) | ~50ms (엣지 CDN) |
| **DB 쿼리** | ~50ms | ~10ms (로컬 SQLite) |
| **Cold Start** | ~1초 | ~0ms (항상 활성) |
| **동시 접속** | 제한적 | 무제한 (CDN) |
| **비용** | $5/월 | ~$0/월 |

---

## 제약사항

### Cloudflare Workers 제한
- ✅ CPU 시간: 50ms (무료), 충분함
- ✅ 메모리: 128MB
- ✅ 요청: 100,000/일 (무료)
- ✅ D1 읽기: 1,000,000/일 (무료)

### 초과 시 비용 (거의 발생 안함)
- 100만 요청: $0.50
- 1000만 D1 행 읽기: $0.001

---

## 다음 단계

1. ✅ Cloudflare D1 데이터베이스 생성
2. ✅ 스키마 마이그레이션 (PostgreSQL → SQLite)
3. ✅ Workers API 코드 작성
4. ✅ Pages 배포 (wc2026, wc2022)
5. ✅ API-Football 연동 테스트

---

## 결론

**Cloudflare 풀스택 = 무료 + 빠름 + 간단함**
- Railway 대비 연간 $50 절감
- 전세계 엣지 네트워크로 더 빠른 속도
- Cloudflare Dashboard에서 모든 것 관리
