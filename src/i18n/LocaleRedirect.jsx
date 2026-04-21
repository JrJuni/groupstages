import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGS, FALLBACK_LANG } from './index.js';

/**
 * 언어 코드 없는 경로 진입 시 브라우저 언어 감지 후 /{detected}/... 로 redirect.
 * 이미 첫 세그먼트가 유효 언어인 경우(= 존재하지 않는 페이지) 무한 루프를 막기 위해
 * 해당 언어 홈으로 보냄.
 */
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

export default function LocaleRedirect() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length > 0 && SUPPORTED_LANGS.includes(segments[0])) {
    return <Navigate to={`/${segments[0]}${location.search}${location.hash}`} replace />;
  }

  const lang = detectBrowserLang();
  const tail = segments.join('/');
  const target = `/${lang}${tail ? '/' + tail : ''}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}
