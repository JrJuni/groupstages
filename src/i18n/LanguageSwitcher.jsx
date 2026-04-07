import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Languages, Check } from 'lucide-react';
import { SUPPORTED_LANGS } from './index.js';

const LANG_LABELS = {
  ko: { native: '한국어', flag: '🇰🇷' },
  en: { native: 'English', flag: '🇺🇸' },
  es: { native: 'Español', flag: '🇪🇸' },
  ja: { native: '日本語', flag: '🇯🇵' },
  zh: { native: '中文', flag: '🇨🇳' },
};

export default function LanguageSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const switchTo = (next) => {
    if (next === lang) {
      setOpen(false);
      return;
    }
    // 현재 path의 첫 segment(현재 lang)를 next로 교체
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0 || !SUPPORTED_LANGS.includes(segments[0])) {
      navigate(`/${next}/`, { replace: false });
    } else {
      segments[0] = next;
      navigate(`/${segments.join('/')}${location.search}${location.hash}`);
    }
    setOpen(false);
  };

  const current = LANG_LABELS[lang] || LANG_LABELS.en;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-fifa-muted hover:text-white hover:bg-white/10 transition-colors"
        title="Language"
      >
        <Languages size={14} />
        <span className="hidden sm:inline">{current.native}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-fifa-card border border-fifa-border rounded-lg shadow-lg overflow-hidden min-w-[140px] z-50">
          {SUPPORTED_LANGS.map((code) => {
            const meta = LANG_LABELS[code];
            const isActive = code === lang;
            return (
              <button
                key={code}
                onClick={() => switchTo(code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                  ${isActive
                    ? 'bg-sky-400/15 text-sky-300'
                    : 'text-fifa-muted hover:text-white hover:bg-white/10'}`}
              >
                <span className="text-base leading-none">{meta.flag}</span>
                <span className="flex-1">{meta.native}</span>
                {isActive && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
