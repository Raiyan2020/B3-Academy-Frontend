'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

export function ShareButton({ title, url, disabled = false }: { title: string; url?: string; disabled?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const share = async () => {
    const canonicalUrl = url || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url: canonicalUrl });
      else await navigator.clipboard.writeText(canonicalUrl);
      setStatus('copied');
    } catch { setStatus('failed'); }
  };
  return <span className="inline-flex flex-col items-start"><button type="button" disabled={disabled} onClick={share} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 disabled:opacity-50"><Share2 size={18} />Share</button><span role="status" className="mt-1 text-xs text-slate-600">{status === 'copied' ? 'Link ready to share' : status === 'failed' ? 'Could not share this link' : ''}</span></span>;
}
