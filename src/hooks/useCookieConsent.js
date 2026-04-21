import { useCallback, useEffect, useState } from 'react';

export const CONSENT_KEY = 'consent_v1';
const CONSENT_EVENT = 'gs:consent-change';

/**
 * 값: 'granted' | 'denied' | null (미응답)
 * Phase 5에서 AdSense script 로딩 조건으로 사용.
 */
export function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === 'granted' || raw === 'denied') return raw;
    return null;
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    if (value === null) localStorage.removeItem(CONSENT_KEY);
    else localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // localStorage 차단 환경 — 무시하고 세션 내 상태만 유지
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    // no-op
  }
  applyGtagConsent(value);
}

/**
 * Phase 5 AdSense/Analytics 연동 hook-point.
 * gtag가 주입돼 있을 때만 consent state를 반영한다.
 */
function applyGtagConsent(value) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  const state = value === 'granted' ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

export function useCookieConsent() {
  const [consent, setConsent] = useState(() => readConsent());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CONSENT_KEY) setConsent(readConsent());
    };
    const onCustom = (e) => setConsent(e.detail ?? null);
    window.addEventListener('storage', onStorage);
    window.addEventListener(CONSENT_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CONSENT_EVENT, onCustom);
    };
  }, []);

  const accept = useCallback(() => writeConsent('granted'), []);
  const reject = useCallback(() => writeConsent('denied'), []);
  const reset = useCallback(() => writeConsent(null), []);

  return { consent, accept, reject, reset };
}
