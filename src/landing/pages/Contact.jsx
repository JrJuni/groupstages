import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout from '../components/LegalLayout.jsx';
import { API_BASE } from '../../config.js';

const FIELD_MAX = { name: 100, email: 200, subject: 200, message: 5000 };

export default function Contact() {
  const { t } = useTranslation('legal');

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    document.title = t('contact.meta.title');
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', t('contact.meta.description'));
  }, [t]);

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value.slice(0, FIELD_MAX[field] || 1000) }));
  }

  function validate() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return false;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email.trim())) return false;
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorKey(null);

    if (!validate()) {
      setStatus('error');
      setErrorKey('errorValidation');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          website: form.website, // honeypot
        }),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '', website: '' });
        return;
      }
      if (res.status === 429) {
        setStatus('error');
        setErrorKey('errorRateLimit');
        return;
      }
      if (res.status === 400) {
        setStatus('error');
        setErrorKey('errorValidation');
        return;
      }
      setStatus('error');
      setErrorKey('errorGeneric');
    } catch {
      setStatus('error');
      setErrorKey('errorGeneric');
    }
  }

  const sending = status === 'sending';
  const success = status === 'success';

  return (
    <LegalLayout
      metaTitleKey="contact.meta.title"
      metaDescKey="contact.meta.description"
      title={t('contact.title')}
    >
      <p className="text-fifa-text/90">{t('contact.intro')}</p>

      {success ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100">
          {t('contact.form.success')}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="c-name" className="block text-sm font-medium mb-1">
              {t('contact.form.name')} <span className="text-fifa-muted text-xs">({t('contact.form.required')})</span>
            </label>
            <input
              id="c-name"
              type="text"
              required
              disabled={sending}
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder={t('contact.form.namePlaceholder')}
              className="w-full rounded-md border border-fifa-border bg-fifa-card px-3 py-2 text-white placeholder-fifa-muted/60 focus:border-fifa-blue focus:outline-none focus:ring-1 focus:ring-fifa-blue"
            />
          </div>

          <div>
            <label htmlFor="c-email" className="block text-sm font-medium mb-1">
              {t('contact.form.email')} <span className="text-fifa-muted text-xs">({t('contact.form.required')})</span>
            </label>
            <input
              id="c-email"
              type="email"
              required
              disabled={sending}
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder={t('contact.form.emailPlaceholder')}
              className="w-full rounded-md border border-fifa-border bg-fifa-card px-3 py-2 text-white placeholder-fifa-muted/60 focus:border-fifa-blue focus:outline-none focus:ring-1 focus:ring-fifa-blue"
            />
          </div>

          <div>
            <label htmlFor="c-subject" className="block text-sm font-medium mb-1">
              {t('contact.form.subject')}
            </label>
            <input
              id="c-subject"
              type="text"
              disabled={sending}
              value={form.subject}
              onChange={(e) => onChange('subject', e.target.value)}
              placeholder={t('contact.form.subjectPlaceholder')}
              className="w-full rounded-md border border-fifa-border bg-fifa-card px-3 py-2 text-white placeholder-fifa-muted/60 focus:border-fifa-blue focus:outline-none focus:ring-1 focus:ring-fifa-blue"
            />
          </div>

          <div>
            <label htmlFor="c-message" className="block text-sm font-medium mb-1">
              {t('contact.form.message')} <span className="text-fifa-muted text-xs">({t('contact.form.required')})</span>
            </label>
            <textarea
              id="c-message"
              rows={7}
              required
              disabled={sending}
              value={form.message}
              onChange={(e) => onChange('message', e.target.value)}
              placeholder={t('contact.form.messagePlaceholder')}
              className="w-full rounded-md border border-fifa-border bg-fifa-card px-3 py-2 text-white placeholder-fifa-muted/60 focus:border-fifa-blue focus:outline-none focus:ring-1 focus:ring-fifa-blue resize-y"
            />
          </div>

          {/* Honeypot — hidden from humans, bots will fill it */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label htmlFor="c-website">Website</label>
            <input
              id="c-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => onChange('website', e.target.value)}
            />
          </div>

          {errorKey && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
              {t(`contact.form.${errorKey}`)}
            </div>
          )}

          <p className="text-xs text-fifa-muted">{t('contact.privacyNote')}</p>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-fifa-blue hover:bg-fifa-blue/80 transition-colors px-5 py-2.5 font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? t('contact.form.sending') : t('contact.form.submit')}
          </button>
        </form>
      )}
    </LegalLayout>
  );
}
