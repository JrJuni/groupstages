import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/matches - 모든 경기 결과 조회
app.get('/api/matches', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, group_key, home_id, away_id, home_score, away_score FROM match_results ORDER BY group_key, id'
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches - 경기 결과 저장 (upsert)
app.post('/api/matches', async (req, res) => {
  const { id, group_key, home_id, away_id, home_score, away_score } = req.body;
  if (!id || !group_key || !home_id || !away_id) {
    return res.status(400).json({ error: 'id, group_key, home_id, away_id 필수' });
  }
  try {
    await pool.query(
      `INSERT INTO match_results (id, group_key, home_id, away_id, home_score, away_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE
         SET home_score = EXCLUDED.home_score,
             away_score = EXCLUDED.away_score,
             updated_at = NOW()`,
      [id, group_key, home_id, away_id,
        home_score !== '' && home_score !== null && home_score !== undefined ? parseInt(home_score) : null,
        away_score !== '' && away_score !== null && away_score !== undefined ? parseInt(away_score) : null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches/:id - 경기 결과 초기화
app.delete('/api/matches/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM match_results WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches - 전체 초기화
app.delete('/api/matches', async (req, res) => {
  try {
    await pool.query('DELETE FROM match_results');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/third-place - DB에서 직접 3위팀 계산 쿼리
app.get('/api/third-place', async (req, res) => {
  try {
    const { rows: matches } = await pool.query(
      `SELECT group_key, home_id, away_id, home_score, away_score
       FROM match_results
       WHERE home_score IS NOT NULL AND away_score IS NOT NULL`
    );

    // 그룹별로 집계
    const groupStats = {};
    for (const m of matches) {
      const g = m.group_key;
      if (!groupStats[g]) groupStats[g] = {};
      const hs = parseInt(m.home_score);
      const as_ = parseInt(m.away_score);
      const addStats = (id, gf, ga, win, draw, lose) => {
        if (!groupStats[g][id]) groupStats[g][id] = { id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
        const s = groupStats[g][id];
        s.played++; s.gf += gf; s.ga += ga;
        if (win) s.won++; else if (draw) s.drawn++; else s.lost++;
      };
      const homeWin = hs > as_, draw = hs === as_;
      addStats(m.home_id, hs, as_, homeWin, draw, !homeWin && !draw);
      addStats(m.away_id, as_, hs, !homeWin && !draw, draw, homeWin);
    }

    // 각 그룹에서 3위팀 추출
    const thirds = [];
    for (const [group, teams] of Object.entries(groupStats)) {
      const arr = Object.values(teams).map((t) => ({
        ...t,
        gd: t.gf - t.ga,
        pts: t.won * 3 + t.drawn,
        group,
      }));
      arr.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
      if (arr.length >= 3) thirds.push(arr[2]);
    }

    // 3위팀 전체 정렬
    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    res.json(thirds);
  } catch (err) {
    console.error('[GET /api/third-place]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
