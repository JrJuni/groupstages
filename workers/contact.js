/**
 * Workers: 문의 폼 핸들러
 *
 * POST /api/contact
 *   body: { name, email, subject?, message, website, lang? }
 *   - honeypot 필드 `website`: 비어있어야 함 (봇이 채우면 조용히 성공 응답)
 *   - IP rate limit: 10분 창 내 5건 초과 시 429
 *   - D1 contact_messages 테이블에 저장 (이메일 발송은 후속 단계에서 MailChannels 추가 예정)
 *
 * 개인정보 주의:
 *   - IP 원문은 저장하지 않는다. 일일 회전 salt + SHA-256 해시만 저장.
 *   - 요청 ORIGIN 체크는 상위 라우터 CORS에서 이미 수행됨.
 */

const WINDOW_SECONDS = 10 * 60; // 10분
const MAX_REQUESTS_PER_WINDOW = 5;

const MAX_LEN = {
  name: 100,
  email: 200,
  subject: 200,
  message: 5000,
  lang: 10,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanStr(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function dailySalt() {
  // UTC 날짜 기반 salt (매일 회전) — IP 재식별 불가능하게 만듦
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

async function hashIp(ip) {
  if (!ip) return null;
  return await sha256Hex(`${dailySalt()}|${ip}`);
}

/**
 * IP rate limit 체크. true면 허용, false면 차단.
 */
async function checkRateLimit(env, ipHash) {
  if (!ipHash) return true; // IP를 못 얻은 경우 통과 (본 Workers는 보통 항상 얻음)

  const row = await env.DB.prepare(
    'SELECT request_count, window_start FROM contact_rate_limit WHERE ip_hash = ?1'
  ).bind(ipHash).first();

  const now = new Date();
  if (!row) {
    await env.DB.prepare(
      `INSERT INTO contact_rate_limit (ip_hash, request_count, window_start)
       VALUES (?1, 1, ?2)`
    ).bind(ipHash, now.toISOString()).run();
    return true;
  }

  const windowStart = new Date(row.window_start);
  const elapsed = (now.getTime() - windowStart.getTime()) / 1000;

  if (elapsed > WINDOW_SECONDS) {
    // 창 리셋
    await env.DB.prepare(
      `UPDATE contact_rate_limit
       SET request_count = 1, window_start = ?1
       WHERE ip_hash = ?2`
    ).bind(now.toISOString(), ipHash).run();
    return true;
  }

  if (row.request_count >= MAX_REQUESTS_PER_WINDOW) return false;

  await env.DB.prepare(
    `UPDATE contact_rate_limit
     SET request_count = request_count + 1
     WHERE ip_hash = ?1`
  ).bind(ipHash).run();
  return true;
}

/**
 * POST /api/contact 핸들러
 * @param {Request} request
 * @param {{DB: D1Database}} env
 * @returns {Response}
 */
export async function handleContact(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const name = cleanStr(body.name, MAX_LEN.name);
  const email = cleanStr(body.email, MAX_LEN.email).toLowerCase();
  const subject = cleanStr(body.subject, MAX_LEN.subject);
  const message = cleanStr(body.message, MAX_LEN.message);
  const lang = cleanStr(body.lang, MAX_LEN.lang);
  const honeypot = typeof body.website === 'string' ? body.website : '';

  // Honeypot: 봇으로 추정. 성공 응답을 주되 저장하지 않음.
  if (honeypot.length > 0) {
    return Response.json({ ok: true }, { headers: corsHeaders });
  }

  // 기본 validation
  if (!name || !email || !message) {
    return Response.json(
      { error: 'name, email, message 필수' },
      { status: 400, headers: corsHeaders }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: 'email 형식 오류' },
      { status: 400, headers: corsHeaders }
    );
  }

  // IP hash → rate limit 체크
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = await hashIp(ip);
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 500);

  const allowed = await checkRateLimit(env, ipHash);
  if (!allowed) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: corsHeaders }
    );
  }

  // D1 저장
  try {
    await env.DB.prepare(
      `INSERT INTO contact_messages (name, email, subject, message, lang, ip_hash, user_agent, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'new', datetime('now'))`
    ).bind(
      name,
      email,
      subject || null,
      message,
      lang || null,
      ipHash,
      userAgent
    ).run();
  } catch (err) {
    console.error('[contact] D1 insert failed', err);
    return Response.json(
      { error: 'Storage error' },
      { status: 500, headers: corsHeaders }
    );
  }

  return Response.json({ ok: true }, { headers: corsHeaders });
}
