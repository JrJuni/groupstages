# 2026 World Cup GroupStages - 데이터 흐름 분석 및 개선 방안

## 📊 현재 상태 요약

### ✅ 정상 작동 기능
1. **경기 결과 입력 및 저장** - PostgreSQL DB 연동 완료
2. **조별 순위 자동 계산** - 승점, 득실차, 헤드투헤드, 페어플레이 규칙 적용
3. **3위팀 상위 8팀 선별** - DB 쿼리 기반 자동 계산
4. **API-Football 연동** - 54개 경기 중 24개 동기화 성공

### ⚠️ 부분 작동 / 문제 있는 기능
1. **API 동기화** - 30/54개 경기 스킵 (55% 실패율)
2. **카드 데이터 관리** - 로컬 상태만 저장 (영속성 없음)
3. **팀 매핑** - 2개 팀 누락 (CUW, CPV)

---

## 🔍 상세 문제 분석

### 문제 1: API 경기 매칭 실패 (24/54개)

#### 원인
**경기 ID 생성 로직 불일치**:
- 우리 DB: `{home}_vs_{away}` (하드코딩 순서)
- API-Football: 실제 홈/어웨이 순서

#### 예시
```javascript
// 우리 DB
id: 'QAT_vs_CHE'  // MATCH_SCHEDULE에서 하드코딩

// API-Football 응답
{
  teams: {
    home: { id: 15, name: 'Switzerland' },  // CHE
    away: { id: 1569, name: 'Qatar' }        // QAT
  }
}

// 변환 결과
converted.id = 'CHE_vs_QAT'  // 매칭 실패!
```

#### 해결 방법 A: 양방향 매칭 (권장)
```javascript
// syncRoutes.js 수정
const { rows: existing } = await pool.query(
  `SELECT group_key FROM match_results
   WHERE (home_id = $1 AND away_id = $2) OR (home_id = $2 AND away_id = $1)
   LIMIT 1`,
  [converted.home_id, converted.away_id]
);
```

#### 해결 방법 B: fixture_id 기반 매칭 (장기적)
```javascript
// MATCH_SCHEDULE에 fixture_id 추가
'MEX_vs_RSA': {
  matchday: 1,
  date: '2026-06-11T19:00:00Z',
  venue: 'Estadio Azteca',
  fixture_id: 1489369  // API-Football ID
}
```

---

### 문제 2: 미매핑 팀 (CUW, CPV)

#### 원인
API-Football 2026 World Cup 데이터에 아직 미포함:
- **CUW (Curaçao)**: API ID 찾을 수 없음
- **CPV (Cape Verde)**: API ID 찾을 수 없음

#### 영향받는 경기 (6개)
```
Group E: ECU_vs_CUW, GER_vs_CUW, CIV_vs_CUW
Group H: ESP_vs_CPV, URU_vs_CPV, SAU_vs_CPV
```

#### 임시 해결책
```sql
-- team_mapping 테이블에 수동 추가 (API ID 확정 시)
INSERT INTO team_mapping (our_team_id, api_team_id, api_team_name, api_team_code)
VALUES
  ('CUW', 5530, 'Curacao', 'CUR'),  -- 가정
  ('CPV', 1533, 'Cape Verde', 'CPV');  -- 가정
```

#### 장기 해결책
API-Football 팀 검색으로 올바른 ID 확인:
```bash
curl -X GET "https://v3.football.api-sports.io/teams?search=curacao" \
  -H "x-rapidapi-key: YOUR_KEY"
```

---

### 문제 3: 카드 데이터 영속성 없음

#### 현재 구현
```javascript
// useMatches.js - handleCardChange
const handleCardChange = useCallback((groupKey, teamId, field, value) => {
  setGroups((prev) => {
    // 로컬 상태만 업데이트
    const newTeams = group.teams.map((t) =>
      t.id !== teamId ? t : { ...t, [field]: parseInt(value) || 0 }
    );
    return { ...prev, [groupKey]: { ...group, teams: newTeams } };
  });
  // ⚠️ API 저장 없음!
}, []);
```

#### 문제점
1. 브라우저 새로고침 시 카드 데이터 손실
2. DB 스키마(`team_statistics`)는 존재하지만 사용하지 않음
3. API-Football에서 카드 데이터를 가져와도 적용할 방법 없음

#### 해결책: API 엔드포인트 추가

**1) 백엔드 라우트 추가**
```javascript
// server/index.js
app.post('/api/team-statistics', async (req, res) => {
  const { team_id, group_key, yellow_cards, two_yellow_red, direct_red } = req.body;

  const fair_play_points = yellow_cards * 1 + two_yellow_red * 3 + direct_red * 4;

  await pool.query(`
    INSERT INTO team_statistics (team_id, group_key, yellow_cards, two_yellow_red, direct_red, fair_play_points, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (team_id, group_key) DO UPDATE
      SET yellow_cards = EXCLUDED.yellow_cards,
          two_yellow_red = EXCLUDED.two_yellow_red,
          direct_red = EXCLUDED.direct_red,
          fair_play_points = EXCLUDED.fair_play_points,
          updated_at = NOW()
  `, [team_id, group_key, yellow_cards, two_yellow_red, direct_red, fair_play_points]);

  res.json({ ok: true });
});

app.get('/api/team-statistics/:groupKey', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM team_statistics WHERE group_key = $1',
    [req.params.groupKey]
  );
  res.json(rows);
});
```

**2) 프론트엔드 수정**
```javascript
// useMatches.js
const handleCardChange = useCallback(async (groupKey, teamId, field, value) => {
  // 로컬 상태 업데이트
  setGroups((prev) => { /* 기존 로직 */ });

  // API 저장 추가
  if (apiAvailable) {
    try {
      await fetch('/api/team-statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          group_key: groupKey,
          [field]: parseInt(value) || 0
        })
      });
    } catch (err) {
      console.warn('[useMatches] 카드 데이터 저장 실패:', err.message);
    }
  }
}, [apiAvailable]);

// 초기 로딩 시 카드 데이터 복원
useEffect(() => {
  async function loadCardStatistics() {
    const allStats = {};
    for (const groupKey of Object.keys(groups)) {
      const res = await fetch(`/api/team-statistics/${groupKey}`);
      const stats = await res.json();
      allStats[groupKey] = stats;
    }

    setGroups((prev) => {
      const next = { ...prev };
      Object.entries(allStats).forEach(([groupKey, stats]) => {
        next[groupKey].teams = next[groupKey].teams.map((team) => {
          const teamStats = stats.find((s) => s.team_id === team.id);
          if (!teamStats) return team;
          return {
            ...team,
            yc: teamStats.yellow_cards,
            twoYR: teamStats.two_yellow_red,
            dr: teamStats.direct_red
          };
        });
      });
      return next;
    });
  }

  if (apiAvailable) {
    loadCardStatistics();
  }
}, [apiAvailable]);
```

---

## 🚀 구현 우선순위

### 우선순위 1: 경기 매칭 로직 개선 (즉시)
**난이도**: 쉬움
**영향도**: 높음 (30개 경기 → 54개 경기로 증가)
**예상 시간**: 30분

**작업 내용**:
1. `server/routes/syncRoutes.js` 수정
2. 양방향 매칭 쿼리 적용
3. 재동기화 테스트

---

### 우선순위 2: 카드 데이터 영속성 추가 (중요)
**난이도**: 중간
**영향도**: 높음 (사용자 데이터 손실 방지)
**예상 시간**: 1-2시간

**작업 내용**:
1. `POST /api/team-statistics` 엔드포인트 추가
2. `GET /api/team-statistics/:groupKey` 엔드포인트 추가
3. `useMatches.js` 수정 (저장 + 로딩 로직)
4. 테스트

---

### 우선순위 3: 미매핑 팀 해결 (보류 가능)
**난이도**: 쉬움 (API 확인 후 수동 추가)
**영향도**: 중간 (6개 경기 영향)
**예상 시간**: 30분

**작업 내용**:
1. API-Football에서 CUW, CPV ID 확인
2. `team_mapping` 테이블 수동 업데이트
3. 재동기화

---

### 우선순위 4: 동기화 UI 추가 (선택)
**난이도**: 중간
**영향도**: 중간 (사용자 경험 개선)
**예상 시간**: 2-3시간

**작업 내용**:
1. Admin 페이지 또는 설정 페이지 추가
2. "API 동기화" 버튼 구현
3. Rate Limit 표시
4. 마지막 동기화 시간 표시
5. 동기화 로그 표시

---

## 📈 개선 후 예상 결과

### 데이터 흐름 (개선 후)
```
[사용자 경험]
경기 일정 페이지 접속
  ↓
GET /api/matches (경기 결과)
GET /api/team-statistics/:groupKey (카드 통계)
  ↓
PostgreSQL에서 데이터 로드
  ↓
화면 렌더링 (모든 데이터 영속화됨)

[관리자 작업]
"API 동기화" 버튼 클릭
  ↓
POST /api/sync/fixtures
  ↓
API-Football에서 54개 경기 + 카드 통계 가져오기
  ↓
PostgreSQL 업데이트 (fixture_id, status, scores, cards)
  ↓
프론트엔드 자동 새로고침 또는 알림
```

### 성능 지표
| 항목 | 현재 | 개선 후 |
|------|------|---------|
| API 동기화 성공률 | 44% (24/54) | 100% (54/54) |
| 카드 데이터 영속성 | ❌ | ✅ |
| 새로고침 시 데이터 유지 | ❌ | ✅ |
| API 호출 횟수 | 1회 (경기만) | 1회 (경기 + 카드) |
| Rate Limit 소비 | 1 request | 1-2 requests |

---

## ✅ 체크리스트

### 즉시 실행 가능
- [ ] 경기 매칭 로직 개선 (양방향 매칭)
- [ ] 재동기화 테스트
- [ ] CUW, CPV 팀 ID 확인

### 2시간 내 완료 가능
- [ ] 카드 데이터 API 엔드포인트 추가
- [ ] useMatches Hook 수정
- [ ] 카드 데이터 로딩/저장 테스트

### 추후 개선
- [ ] 동기화 UI 추가
- [ ] fixture_id 기반 매칭
- [ ] Cron job으로 자동 동기화
- [ ] WebSocket 실시간 업데이트

---

## 📝 결론

현재 시스템은 **기본 기능은 잘 작동**하지만, **API 통합과 데이터 영속성**에서 개선이 필요합니다.

**핵심 문제**:
1. 경기 매칭 로직 불완전 → 30개 경기 동기화 실패
2. 카드 데이터 영속성 없음 → 사용자 데이터 손실 위험

**권장 조치**:
1. 양방향 경기 매칭 로직 구현 (30분)
2. 카드 데이터 API 추가 (1-2시간)

이 두 가지만 해결하면 **API-Football 데이터를 완전히 활용**할 수 있으며, 사용자 경험이 크게 개선됩니다.
