import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import TestApp from './TestApp.jsx';
import './i18n';
import LocaleGate from './i18n/LocaleGate.jsx';
import LocaleRedirect from './i18n/LocaleRedirect.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/wc2026">
      <Routes>
        {/* 언어 코드가 있는 경로 */}
        <Route path="/:lang" element={<LocaleGate><App /></LocaleGate>} />
        <Route path="/:lang/wctest" element={<LocaleGate><TestApp /></LocaleGate>} />
        {/* 언어 코드 없는 경로 → 자동 감지 후 redirect */}
        <Route path="/" element={<LocaleRedirect />} />
        <Route path="/wctest" element={<LocaleRedirect />} />
        <Route path="*" element={<LocaleRedirect />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
