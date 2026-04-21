import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SUPPORTED_LANGS } from './index.js';

const SITE = 'https://groupstages.com';
const X_DEFAULT_LANG = 'en';

const OG_LOCALE = {
  ko: 'ko_KR',
  en: 'en_US',
  es: 'es_ES',
  ja: 'ja_JP',
  zh: 'zh_CN',
};

function ensureLink(rel, hreflang = null) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  return el;
}

function setMetaProperty(property, value) {
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/**
 * 라우트 변경 시 <html lang>, canonical, hreflang alternates, og:locale, og:url을 갱신.
 * 모든 레이아웃(Landing/App/TestApp/Legal) 상단에서 호출.
 */
export function useSeoMeta() {
  const { lang } = useParams();
  const location = useLocation();

  useEffect(() => {
    const currentLang = lang && SUPPORTED_LANGS.includes(lang) ? lang : X_DEFAULT_LANG;

    // 언어 뒤의 경로 부분만 추출: /ko/wc2026/... → /wc2026/...
    const segments = location.pathname.split('/').filter(Boolean);
    const suffix =
      segments.length > 0 && SUPPORTED_LANGS.includes(segments[0])
        ? '/' + segments.slice(1).join('/')
        : location.pathname;
    const normalizedSuffix = suffix === '/' ? '' : suffix.replace(/\/$/, '');

    // <html lang> 동기화
    document.documentElement.lang = currentLang;

    // canonical
    const canonical = ensureLink('canonical');
    canonical.href = `${SITE}/${currentLang}${normalizedSuffix}`;

    // hreflang alternates
    for (const l of SUPPORTED_LANGS) {
      const el = ensureLink('alternate', l);
      el.href = `${SITE}/${l}${normalizedSuffix}`;
    }
    const xDefault = ensureLink('alternate', 'x-default');
    xDefault.href = `${SITE}/${X_DEFAULT_LANG}${normalizedSuffix}`;

    // OG URL & locale
    setMetaProperty('og:url', `${SITE}/${currentLang}${normalizedSuffix}`);
    setMetaProperty('og:locale', OG_LOCALE[currentLang] || OG_LOCALE.en);
  }, [lang, location.pathname]);
}
