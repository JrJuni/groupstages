import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGS, FALLBACK_LANG } from './index.js';

function detectBrowserLang() {
  if (typeof navigator === 'undefined') return FALLBACK_LANG;
  const candidates = [navigator.language, ...(navigator.languages || [])];
  for (const c of candidates) {
    if (!c) continue;
    const base = c.toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  return FALLBACK_LANG;
}

/**
 * /wc2026/* (구 URL) → /:lang/wc2026/* 로 redirect.
 * 기존 북마크/공유 링크 호환성 유지용.
 */
export default function LegacyWc2026Redirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/wc2026\/?/, '');
  const segments = rest.split('/').filter(Boolean);

  if (segments.length === 0) {
    const lang = detectBrowserLang();
    return <Navigate to={`/${lang}/wc2026${location.search}${location.hash}`} replace />;
  }

  const maybeLang = segments[0];
  const tail = segments.slice(1).join('/');

  if (SUPPORTED_LANGS.includes(maybeLang)) {
    const target = `/${maybeLang}/wc2026${tail ? '/' + tail : ''}${location.search}${location.hash}`;
    return <Navigate to={target} replace />;
  }

  const lang = detectBrowserLang();
  const target = `/${lang}/wc2026/${segments.join('/')}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}
