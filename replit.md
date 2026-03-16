# GroupStages - 2026 FIFA World Cup Calculator

## Project Overview
2026 FIFA 월드컵 조별리그 경우의 수 계산 및 조추첨 시뮬레이터 웹 애플리케이션.

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **Icons**: Lucide React
- **Image Export**: html2canvas
- **Runtime**: Node.js 20

## Architecture
- Pure frontend SPA (no backend required)
- All state managed in React (useState, useCallback)
- Hosted on Cloudflare Pages (planned)

## Key Features
1. **조별리그 순위 계산**: 12개 조, 48팀, 실시간 경기 결과 입력
2. **FIFA 동점 처리**: 승점 → 득실차 → 다득점 → 헤드투헤드
3. **3위팀 상위 8팀**: 자동 판별 및 비교 테이블
4. **조추첨 시뮬레이터**: Pot 1-4 시스템, 지리적 제약조건, 애니메이션
5. **공유 기능**: Reddit Markdown, HTML 표 복사, 이미지 저장
6. **광고 레이아웃**: AdSense 슬롯 (상단/사이드/하단)

## Project Structure
```
src/
  App.jsx              - 메인 앱 (탭 네비게이션, 상태 관리)
  main.jsx             - React 진입점
  index.css            - Tailwind + 글로벌 스타일
  data/
    worldcup2026.js    - 48팀 데이터, Pot 구성
  utils/
    rankings.js        - 순위 계산 알고리즘 (헤드투헤드 포함)
    draw.js            - 조추첨 로직 (feasibility 체크 포함)
  components/
    GroupTable.jsx     - 개별 조 순위표 + 경기 결과 입력
    ThirdPlaceTable.jsx - 3위팀 비교 테이블
    DrawSimulator.jsx  - 조추첨 시뮬레이터 UI
    ShareButtons.jsx   - 공유 버튼 (MD/HTML/이미지)
```

## Running the App
```
npm run dev   # localhost:5000
npm run build # Cloudflare Pages 배포용 빌드
```

## GitHub Repository
- Remote: https://github.com/JrJuni/groupstages.git
- Branch: main
