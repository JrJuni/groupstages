import axios from 'axios';
import dotenv from 'dotenv';
import cacheService from './cacheService.js';

dotenv.config();

class ApiFootballService {
  constructor() {
    this.baseURL = 'https://v3.football.api-sports.io';
    this.headers = {
      'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'v3.football.api-sports.io',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY
    };
    this.leagueId = process.env.WORLD_CUP_LEAGUE_ID || 1;
    this.season = process.env.WORLD_CUP_SEASON || 2026;
  }

  /**
   * API 호출 래퍼 (에러 핸들링 + Rate Limit 체크)
   */
  async _request(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: this.headers,
        params
      });

      // Rate Limit 로깅
      const remaining = response.headers['x-ratelimit-requests-remaining'];
      const limit = response.headers['x-ratelimit-requests-limit'];
      console.log(`[API-Football] Rate Limit: ${remaining}/${limit} remaining`);

      if (parseInt(remaining) < 10) {
        console.warn(`⚠️  Rate Limit 경고: ${remaining}회 남음`);
      }

      return response.data;
    } catch (error) {
      console.error(`[API-Football] ${endpoint} 호출 실패:`, error.response?.data || error.message);

      if (error.response?.status === 429) {
        throw new Error('Rate Limit 초과. 잠시 후 다시 시도하세요.');
      }
      if (error.response?.status === 401) {
        throw new Error('API 인증 실패. API 키를 확인하세요.');
      }

      throw error;
    }
  }

  /**
   * 1. 모든 World Cup 경기 가져오기 (캐싱 적용)
   */
  async getAllFixtures() {
    const cacheKey = `fixtures_${this.leagueId}_${this.season}`;

    // 캐시 확인 (1시간 TTL)
    const cached = await cacheService.get(cacheKey, 60 * 60);
    if (cached) {
      console.log(`[API-Football] 캐시에서 경기 일정 로드 (${cached.length}개)`);
      return cached;
    }

    // API 호출
    console.log(`[API-Football] 경기 일정 조회 중... (League: ${this.leagueId}, Season: ${this.season})`);

    const data = await this._request('/fixtures', {
      league: this.leagueId,
      season: this.season
    });

    console.log(`✅ ${data.response.length}개 경기 발견`);

    // 캐시 저장
    await cacheService.set(cacheKey, data.response);

    return data.response;
  }

  /**
   * 2. 특정 경기 상세 정보 (점수, 상태, 카드 등) (캐싱 적용)
   */
  async getFixtureDetails(fixtureId) {
    const cacheKey = `fixture_${fixtureId}`;

    // 캐시 확인 - TTL은 경기 상태에 따라 달라짐
    // 일단 5분 TTL로 확인, 경기 종료된 경우 무제한 캐시
    const cached = await cacheService.get(cacheKey, 5 * 60);
    if (cached) {
      console.log(`[API-Football] 캐시에서 Fixture ${fixtureId} 로드`);
      return cached;
    }

    // API 호출
    console.log(`[API-Football] Fixture ${fixtureId} 상세 정보 조회 중...`);

    const data = await this._request('/fixtures', {
      id: fixtureId
    });

    if (data.response && data.response.length > 0) {
      const fixture = data.response[0];

      // 캐시 저장 (경기 상태에 따라 TTL 다르게 적용)
      await cacheService.set(cacheKey, fixture);

      return fixture;
    }

    throw new Error(`Fixture ${fixtureId}를 찾을 수 없습니다.`);
  }

  /**
   * 3. 특정 경기의 통계 (카드, 슈팅, 코너킥 등) (캐싱 적용)
   */
  async getFixtureStatistics(fixtureId) {
    const cacheKey = `fixture_stats_${fixtureId}`;

    // 캐시 확인 (5분 TTL)
    const cached = await cacheService.get(cacheKey, 5 * 60);
    if (cached) {
      console.log(`[API-Football] 캐시에서 Fixture ${fixtureId} 통계 로드`);
      return cached;
    }

    // API 호출
    console.log(`[API-Football] Fixture ${fixtureId} 통계 조회 중...`);

    const data = await this._request('/fixtures/statistics', {
      fixture: fixtureId
    });

    // 캐시 저장
    await cacheService.set(cacheKey, data.response);

    return data.response; // 배열: [{ team: ..., statistics: [...] }, ...]
  }

  /**
   * 4. 특정 경기의 이벤트 (골, 카드, 교체 등) (캐싱 적용)
   */
  async getFixtureEvents(fixtureId) {
    const cacheKey = `fixture_events_${fixtureId}`;

    // 캐시 확인 (5분 TTL)
    const cached = await cacheService.get(cacheKey, 5 * 60);
    if (cached) {
      console.log(`[API-Football] 캐시에서 Fixture ${fixtureId} 이벤트 로드`);
      return cached;
    }

    // API 호출
    console.log(`[API-Football] Fixture ${fixtureId} 이벤트 조회 중...`);

    const data = await this._request('/fixtures/events', {
      fixture: fixtureId
    });

    // 캐시 저장
    await cacheService.set(cacheKey, data.response);

    return data.response; // 배열: [{ time: ..., team: ..., type: "Goal"|"Card", ... }, ...]
  }

  /**
   * 5. 조별리그 경기만 필터링
   * @param {Array} fixtures - getAllFixtures() 결과
   * @returns {Array} 조별리그 경기 목록
   */
  filterGroupStageFixtures(fixtures) {
    return fixtures.filter(f =>
      f.league.round && f.league.round.includes('Group')
    );
  }

  /**
   * 6. 경기 데이터를 우리 DB 형식으로 변환
   * @param {Object} fixture - API fixture 객체
   * @param {Object} teamMapping - { api_team_id: our_team_id }
   */
  convertFixtureToDbFormat(fixture, teamMapping) {
    const homeApiId = fixture.teams.home.id;
    const awayApiId = fixture.teams.away.id;

    const homeId = teamMapping[homeApiId];
    const awayId = teamMapping[awayApiId];

    if (!homeId || !awayId) {
      console.warn(`⚠️  Fixture ${fixture.fixture.id}: 매핑되지 않은 팀 (Home: ${homeApiId}, Away: ${awayApiId})`);
      return null;
    }

    // Matchday 추출 (예: "Group Stage - 1" → 1)
    const matchdayMatch = fixture.league.round?.match(/(\d+)/);
    const matchday = matchdayMatch ? parseInt(matchdayMatch[1]) : null;

    return {
      id: `${homeId}_vs_${awayId}`,
      fixture_id: fixture.fixture.id,
      group_key: null, // 나중에 수동으로 설정하거나 별도 로직 필요
      home_id: homeId,
      away_id: awayId,
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      matchday: matchday,
      match_date: fixture.fixture.date,
      status: fixture.fixture.status.short // NS, FT, 1H, HT, 2H, etc.
    };
  }

  /**
   * 7. 경기 이벤트에서 카드 통계 추출
   * @param {Array} events - getFixtureEvents() 결과
   * @returns {Object} { teamId: { yellowCards: n, red: n, twoYellowRed: n } }
   */
  extractCardStatistics(events) {
    const stats = {};

    events.forEach(event => {
      if (event.type !== 'Card') return;

      const teamId = event.team.id;
      if (!stats[teamId]) {
        stats[teamId] = { yellowCards: 0, red: 0, twoYellowRed: 0 };
      }

      if (event.detail === 'Yellow Card') {
        stats[teamId].yellowCards++;
      } else if (event.detail === 'Red Card') {
        // "Second Yellow card" 체크
        const isTwoYellow = event.comments?.includes('Second Yellow') || false;
        if (isTwoYellow) {
          stats[teamId].twoYellowRed++;
        } else {
          stats[teamId].red++;
        }
      }
    });

    return stats;
  }

  /**
   * 8. 특정 팀의 최근 N경기 fixture 가져오기 (폼 집계용)
   * @param {number} apiTeamId
   * @param {number} [n=10]
   * @returns {Promise<Array>} fixture 배열 (FT만 필터링은 호출 측에서)
   */
  async getLastNFixtures(apiTeamId, n = 10) {
    const cacheKey = `team_last_${apiTeamId}_${n}`;

    // 캐시 확인 (6시간 TTL — 폼은 변동성 낮음)
    const cached = await cacheService.get(cacheKey, 6 * 60 * 60);
    if (cached) {
      console.log(`[API-Football] 캐시에서 팀 ${apiTeamId} 최근 ${n}경기 로드`);
      return cached;
    }

    console.log(`[API-Football] 팀 ${apiTeamId} 최근 ${n}경기 조회 중...`);
    const data = await this._request('/fixtures', {
      team: apiTeamId,
      last: n,
    });

    const fixtures = data?.response ?? [];
    await cacheService.set(cacheKey, fixtures);
    return fixtures;
  }

  /**
   * 9. Rate Limit 체크
   */
  async checkRateLimit() {
    try {
      const data = await this._request('/status');
      return {
        remaining: data.requests.remaining,
        limit: data.requests.limit_day
      };
    } catch (error) {
      console.error('[API-Football] Rate Limit 체크 실패:', error.message);
      return null;
    }
  }
}

export default new ApiFootballService();
