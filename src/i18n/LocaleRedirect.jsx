import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SUPPORTED_LANGS, FALLBACK_LANG } from './index.js';

/**
 * 언어 코드 없는 경로(`/`, `/wctest` 등) 진입 시
 * 브라우저 언어를 감지하여 /{detected}/... 로 redirect
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
  const lang = detectBrowserLang();
  // 현재 경로 앞에 lang 추가
  const cleanPath = location.pathname.startsWith('/') ? location.pathname.slice(1) : location.pathname;
  const target = `/${lang}/${cleanPath}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}
