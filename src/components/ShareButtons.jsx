import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, Table, CheckCircle } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function ShareButtons({ targetId, generateMarkdown, generateHtmlTable }) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(null);

  const copyMarkdown = async () => {
    try {
      const text = generateMarkdown();
      await navigator.clipboard.writeText(text);
      setCopied('markdown');
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  const copyHtml = async () => {
    try {
      const html = generateHtmlTable();
      await navigator.clipboard.writeText(html);
      setCopied('html');
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  const saveImage = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#0d1117',
        pixelRatio: 2,
        skipFonts: false,
      });
      const link = document.createElement('a');
      link.download = 'groupstages-result.png';
      link.href = dataUrl;
      link.click();
      setCopied('image');
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('html-to-image error:', e);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={copyMarkdown}
        className="btn-ghost flex items-center gap-1.5 text-xs"
        title={t('share.redditMdTooltip')}
      >
        {copied === 'markdown' ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
        {t('share.redditMd')}
      </button>
      <button
        onClick={copyHtml}
        className="btn-ghost flex items-center gap-1.5 text-xs"
        title={t('share.htmlTableTooltip')}
      >
        {copied === 'html' ? <CheckCircle size={13} className="text-green-400" /> : <Table size={13} />}
        {t('share.htmlTable')}
      </button>
      <button
        onClick={saveImage}
        className="btn-ghost flex items-center gap-1.5 text-xs"
        title={t('share.saveImageTooltip')}
      >
        {copied === 'image' ? <CheckCircle size={13} className="text-green-400" /> : <Download size={13} />}
        {t('share.saveImage')}
      </button>
    </div>
  );
}
