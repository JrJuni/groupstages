# Cloudflare Pages 배포 가이드

## 프로젝트 구조
```
groupstages.com
├── /wc2026  (main 브랜치)      - 48팀 버전
└── /wc2022  (wc2022 브랜치)    - 32팀 버전 (예정)
```

## 배포 설정

### 1. Cloudflare Pages 프로젝트 생성
1. Cloudflare Dashboard → Pages → Create a project
2. GitHub 연결 → `groupstages` 레포지토리 선택
3. Production 브랜치: `main`

### 2. 빌드 설정
```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (empty)
Environment variables:
  - NODE_VERSION: 18
```

### 3. 커스텀 도메인 설정
1. Pages 프로젝트 → Custom domains
2. `groupstages.com` 추가
3. DNS 자동 설정 확인

### 4. 브랜치별 배포 (wc2022 브랜치 준비 후)
1. Settings → Builds & deployments
2. Preview deployments → Enable for: `wc2022`
3. wc2022 브랜치는 `/wc2022` 경로로 배포됨

## API 엔드포인트 설정

### 프로덕션 API URL
백엔드 배포 후 환경 변수 추가:
```
VITE_API_URL=https://your-railway-app.railway.app
```

## 배포 후 확인 사항
- [ ] https://groupstages.com/wc2026 접속 확인
- [ ] API 연동 확인
- [ ] 경기 데이터 로드 확인
- [ ] 모든 탭 동작 확인
