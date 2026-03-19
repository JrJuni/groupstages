import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import TestApp from './TestApp.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/wc2026">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/wctest" element={<TestApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
