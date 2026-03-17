/**
 * Cloudflare Workers API
 * PostgreSQL Express API를 D1 (SQLite)로 마이그레이션
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/matches - 모든 경기 결과 조회
      if (path === '/api/matches' && method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT id, group_key, home_id, away_id, home_score, away_score,
                 matchday, match_date, status, fixture_id
          FROM match_results
          ORDER BY
            CASE WHEN match_date IS NULL THEN 1 ELSE 0 END,
            match_date ASC,
            group_key,
            id
        `).all();

        return Response.json(results, { headers: corsHeaders });
      }

      // POST /api/matches - 경기 결과 저장 (upsert)
      if (path === '/api/matches' && method === 'POST') {
        const body = await request.json();
        const { id, group_key, home_id, away_id, home_score, away_score,
                matchday, match_date, status, fixture_id } = body;

        if (!id || !group_key || !home_id || !away_id) {
          return Response.json(
            { error: 'id, group_key, home_id, away_id 필수' },
            { status: 400, headers: corsHeaders }
          );
        }

        // SQLite upsert 문법
        await env.DB.prepare(`
          INSERT INTO match_results
            (id, group_key, home_id, away_id, home_score, away_score,
             matchday, match_date, status, fixture_id, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            home_score  = COALESCE(?5, home_score),
            away_score  = COALESCE(?6, away_score),
            matchday    = COALESCE(?7, matchday),
            match_date  = COALESCE(?8, match_date),
            status      = COALESCE(?9, status),
            fixture_id  = COALESCE(?10, fixture_id),
            updated_at  = datetime('now')
        `).bind(
          id, group_key, home_id, away_id,
          home_score !== '' && home_score !== null && home_score !== undefined ? parseInt(home_score) : null,
          away_score !== '' && away_score !== null && away_score !== undefined ? parseInt(away_score) : null,
          matchday ?? null,
          match_date ?? null,
          status ?? 'NS',
          fixture_id ?? null
        ).run();

        return Response.json({ ok: true }, { headers: corsHeaders });
      }

      // DELETE /api/matches/:id - 특정 경기 삭제
      const deleteMatch = path.match(/^\/api\/matches\/([^\/]+)$/);
      if (deleteMatch && method === 'DELETE') {
        const matchId = deleteMatch[1];
        await env.DB.prepare('DELETE FROM match_results WHERE id = ?1')
          .bind(matchId)
          .run();
        return Response.json({ ok: true }, { headers: corsHeaders });
      }

      // DELETE /api/matches - 전체 경기 삭제
      if (path === '/api/matches' && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM match_results').run();
        return Response.json({ ok: true }, { headers: corsHeaders });
      }

      // GET /api/third-place - 3위팀 집계 쿼리
      if (path === '/api/third-place' && method === 'GET') {
        const { results: matches } = await env.DB.prepare(`
          SELECT group_key, home_id, away_id, home_score, away_score
          FROM match_results
          WHERE home_score IS NOT NULL AND away_score IS NOT NULL
        `).all();

        return Response.json(matches, { headers: corsHeaders });
      }

      // 404 Not Found
      return Response.json(
        { error: 'Not Found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('[Workers API Error]', error);
      return Response.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
