import express from 'express';
import session from 'express-session';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './db.js';
import { uploadToR2, getPresignedUrl } from './services/storage.js';
import { synthesizeClothes } from './services/synthesis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// multer: 메모리에 파일 임시 저장 (최대 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'yea-project-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

const requireAuth = (req, res, next) => {
  if (req.session?.user) return next();
  res.redirect('/');
};

// ── Auth ──────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session?.user) return res.redirect('/home');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || user.password !== password) {
      return res.render('login', { error: '아이디 또는 비밀번호가 틀렸어요.' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role, display_name: user.display_name };
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.render('login', { error: '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' });
  }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.get('/signup', (req, res) => res.redirect('/'));

// ── Pages ─────────────────────────────────────────
app.get('/home',        requireAuth, (req, res) => res.render('home',        { user: req.session.user }));
app.get('/clothes',     requireAuth, (req, res) => res.render('clothes',     { user: req.session.user }));
app.get('/marketplace', requireAuth, (req, res) => res.render('marketplace', { user: req.session.user }));
app.get('/store',       requireAuth, (req, res) => res.render('store',       { user: req.session.user }));
app.get('/settings',    requireAuth, (req, res) => res.render('settings',    { user: req.session.user }));

// ── Clothes Synthesis API ─────────────────────────
app.post(
  '/api/clothes/synthesize',
  requireAuth,
  upload.fields([{ name: 'baby', maxCount: 1 }, { name: 'cloth', maxCount: 1 }]),
  async (req, res) => {
    try {
      const babyFile  = req.files?.baby?.[0];
      const clothFile = req.files?.cloth?.[0];

      if (!babyFile || !clothFile) {
        return res.status(400).json({ error: '아기 사진과 옷 사진을 모두 업로드해 주세요.' });
      }

      // 1. 리사이징 (512×512, 품질 90%)
      const [babyResized, clothResized] = await Promise.all([
        sharp(babyFile.buffer).resize(512, 512, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer(),
        sharp(clothFile.buffer).resize(512, 512, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer(),
      ]);

      // 2. R2에 원본 + 리사이즈 업로드
      const ts = Date.now();
      const uid = req.session.user.id;
      const babyKey  = `uploads/${uid}/baby_${ts}.jpg`;
      const clothKey = `uploads/${uid}/cloth_${ts}.jpg`;

      await Promise.all([
        uploadToR2(babyResized,  babyKey,  'image/jpeg'),
        uploadToR2(clothResized, clothKey, 'image/jpeg'),
      ]);

      // 3. Vertex AI 합성
      const babyBase64  = babyResized.toString('base64');
      const clothBase64 = clothResized.toString('base64');
      const resultBase64 = await synthesizeClothes(babyBase64, clothBase64);

      // 4. 결과 R2 저장
      const resultBuffer = Buffer.from(resultBase64, 'base64');
      const resultKey = `results/${uid}/result_${ts}.jpg`;
      await uploadToR2(resultBuffer, resultKey, 'image/jpeg');

      // 5. presigned URL 반환 (1시간)
      const resultUrl = await getPresignedUrl(resultKey, 3600);

      res.json({ success: true, resultUrl });
    } catch (err) {
      console.error('합성 오류:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(PORT, () => console.log(`예쁜 아가 server on port ${PORT}`));
