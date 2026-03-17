# Railway 백엔드 배포 가이드

## 배포 플랜
- **Railway**: $5/월 Hobby Plan
- **PostgreSQL**: Railway 내장 (추가 비용 없음)
- **예상 총 비용**: $5-8/월

## 배포 단계

### 1. Railway 프로젝트 생성
1. https://railway.app 가입 (GitHub 연동)
2. New Project → Deploy from GitHub repo
3. `groupstages` 레포지토리 선택
4. 브랜치: `main`

### 2. PostgreSQL 추가
1. Railway 프로젝트 → New → Database → PostgreSQL
2. 자동으로 `DATABASE_URL` 환경 변수 생성됨

### 3. 환경 변수 설정
Railway 프로젝트 → Variables 탭:
```bash
# 복호화 키 (.env.keys에서 복사)
DOTENV_PRIVATE_KEY=your_private_key_here

# API-Football (암호화된 값 그대로)
RAPIDAPI_KEY=encrypted:...
RAPIDAPI_HOST=encrypted:...
WORLD_CUP_LEAGUE_ID=encrypted:...
WORLD_CUP_SEASON=encrypted:...

# Database (Railway가 자동 생성)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Port
API_PORT=3001
PORT=3001
```

### 4. 빌드 설정
Railway가 자동으로 감지하지만, 필요시 설정:
```
Start Command: dotenvx run -- node server/index.js
```

### 5. 도메인 연결
1. Railway 프로젝트 → Settings → Networking
2. Custom Domain → `api.groupstages.com` 추가
3. Cloudflare에서 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: api
   Target: your-railway-app.railway.app
   ```

### 6. DB 스키마 초기화
Railway 프로젝트 터미널에서:
```bash
psql $DATABASE_URL < scripts/init_schema.sql
node scripts/seedMatches.js
```

## 배포 후 테스트
```bash
# API 상태 확인
curl https://api.groupstages.com/api/matches

# 동기화 테스트
curl -X POST https://api.groupstages.com/api/sync/fixtures
```

## 비용 예상
- Railway Hobby: $5/월 (5GB 스토리지, 500시간 실행)
- PostgreSQL: 포함됨
- 대역폭: 100GB/월 포함 (충분함)

## 대안: Render (무료 옵션)
- 무료 플랜 가능 (단, 15분 비활성화 시 슬립 모드)
- PostgreSQL 별도 ($7/월)
