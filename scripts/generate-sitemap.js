#!/usr/bin/env node
/**
 * Sitemap 생성기 (빌드 타임 실행)
 *
 * 구조: 5 언어 × 6 페이지 (랜딩, wc2026, privacy, terms, about, contact) = 30 URL
 * 각 URL은 xhtml:link hreflang alternates를 5개 언어 + x-default 로 제공.
 * 출력: public/sitemap.xml (정적 자산으로 Pages가 / 경로에서 서빙)
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://groupstages.com';
const LANGS = ['ko', 'en', 'es', 'ja', 'zh'];
const X_DEFAULT_LANG = 'en';

// 각 페이지: path suffix (언어 뒤), priority, changefreq
// 랜딩/메인은 자주 갱신, 법적 페이지는 드물게 갱신
const PAGES = [
  { suffix: '',          priority: '1.0', changefreq: 'daily' },   // /:lang  (landing)
  { suffix: '/wc2026',   priority: '0.9', changefreq: 'hourly' },  // /:lang/wc2026
  { suffix: '/about',    priority: '0.6', changefreq: 'monthly' },
  { suffix: '/privacy',  priority: '0.4', changefreq: 'yearly' },
  { suffix: '/terms',    priority: '0.4', changefreq: 'yearly' },
  { suffix: '/contact',  priority: '0.5', changefreq: 'monthly' },
];

const today = new Date().toISOString().slice(0, 10);

function urlFor(lang, suffix) {
  return `${SITE}/${lang}${suffix}`;
}

function buildAlternates(suffix) {
  const links = LANGS.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, suffix)}"/>`
  ).join('\n');
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(X_DEFAULT_LANG, suffix)}"/>`;
  return `${links}\n${xDefault}`;
}

function buildUrlBlock(lang, page) {
  return `  <url>
    <loc>${urlFor(lang, page.suffix)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${buildAlternates(page.suffix)}
  </url>`;
}

const urls = [];
for (const lang of LANGS) {
  for (const page of PAGES) {
    urls.push(buildUrlBlock(lang, page));
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');

console.log(`[sitemap] generated ${urls.length} URLs → ${outPath}`);
