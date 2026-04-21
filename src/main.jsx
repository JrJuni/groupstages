import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './i18n';
import LocaleGate from './i18n/LocaleGate.jsx';
import LocaleRedirect from './i18n/LocaleRedirect.jsx';
import LegacyWc2026Redirect from './i18n/LegacyWc2026Redirect.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import './index.css';

const LandingPage = lazy(() => import('./landing/LandingPage.jsx'));
const App = lazy(() => import('./App.jsx'));
const TestApp = lazy(() => import('./TestApp.jsx'));
const PrivacyPolicy = lazy(() => import('./landing/pages/PrivacyPolicy.jsx'));
const TermsOfService = lazy(() => import('./landing/pages/TermsOfService.jsx'));
const About = lazy(() => import('./landing/pages/About.jsx'));
const Contact = lazy(() => import('./landing/pages/Contact.jsx'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-fifa-dark flex items-center justify-center text-fifa-muted text-sm">
      Loading…
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* 구 URL 호환: /wc2026/* → /:lang/wc2026/* */}
          <Route path="/wc2026" element={<LegacyWc2026Redirect />} />
          <Route path="/wc2026/*" element={<LegacyWc2026Redirect />} />

          {/* 랜딩 및 메인 라우트 */}
          <Route path="/:lang" element={<LocaleGate><LandingPage /></LocaleGate>} />
          <Route path="/:lang/wc2026" element={<LocaleGate><App /></LocaleGate>} />
          <Route path="/:lang/wc2026/wctest" element={<LocaleGate><TestApp /></LocaleGate>} />

          {/* 법적 페이지 (AdSense 승인 필수) */}
          <Route path="/:lang/privacy" element={<LocaleGate><PrivacyPolicy /></LocaleGate>} />
          <Route path="/:lang/terms" element={<LocaleGate><TermsOfService /></LocaleGate>} />
          <Route path="/:lang/about" element={<LocaleGate><About /></LocaleGate>} />
          <Route path="/:lang/contact" element={<LocaleGate><Contact /></LocaleGate>} />

          {/* 루트 및 언어코드 없는 경로 → 언어 감지 후 redirect */}
          <Route path="/" element={<LocaleRedirect />} />
          <Route path="*" element={<LocaleRedirect />} />
        </Routes>
      </Suspense>
      <CookieConsent />
    </BrowserRouter>
  </React.StrictMode>
);
