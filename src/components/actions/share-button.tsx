'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useLanguage } from '@/LanguageContext';

export function ShareButton({ title, url, disabled = false }: { title: string; url?: string; disabled?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  // This renders on public detail pages (clinic, course, book, trip…), all of which
  // are Arabic by default — the label and both status messages were hardcoded English.
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const share = async () => {
    const canonicalUrl = url || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url: canonicalUrl });
      else await navigator.clipboard.writeText(canonicalUrl);
      setStatus('copied');
    } catch { setStatus('failed'); }
  };
  return <span className="inline-flex flex-col items-start"><button type="button" disabled={disabled} onClick={share} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 disabled:opacity-50"><Share2 size={18} />{isAr ? 'مشاركة' : 'Share'}</button><span role="status" className="mt-1 text-xs text-slate-600">{status === 'copied' ? (isAr ? 'تم نسخ الرابط للمشاركة' : 'Link ready to share') : status === 'failed' ? (isAr ? 'تعذّرت مشاركة هذا الرابط' : 'Could not share this link') : ''}</span></span>;
}
