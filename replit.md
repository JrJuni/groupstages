# groupstages (예쁜 아가)

## Project Overview
A Node.js/Express web application using EJS templating. Baby clothing synthesis and marketplace platform.

## Architecture
- **Framework**: Express.js (ESM modules)
- **Template Engine**: EJS
- **Database**: PostgreSQL (via `pg`)
- **Storage**: Cloudflare R2 (via AWS SDK)
- **Image Processing**: sharp
- **Authentication**: Session-based (express-session), supports KakaoTalk, Naver, Google OAuth

## Key Files
- `index.js` — Main Express server, all routes, runs on port 5000
- `db.js` — PostgreSQL connection pool
- `github.js` — GitHub integration helpers
- `services/storage.js` — R2 upload/presigned URL helpers
- `services/synthesis.js` — Vertex AI clothes synthesis
- `views/` — EJS templates (login, home, clothes, marketplace, store, settings)
- `public/style.css` — Global styles

## GitHub Repository
- Remote: https://github.com/JrJuni/groupstages.git
- Branch: main

## Running the App
```
node index.js
```
Runs on port 5000.

## Environment Variables Required
- PostgreSQL connection (DATABASE_URL or similar)
- R2/S3 credentials for storage
- OAuth credentials (KakaoTalk, Naver, Google)
