'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Renders an ebook page-by-page onto <canvas>.
 *
 * The previous reader put the signed stream URL straight into an <iframe>, which handed the
 * original PDF to the browser's built-in viewer — and that viewer's toolbar offers Save and
 * Print on exactly that file. Any paying customer could export the book in one click.
 *
 * Rendering to canvas means no file object is ever exposed to a viewer UI, and the watermark
 * below is burned into the same canvas so it survives a screenshot. This does NOT make the
 * bytes unreachable (a determined user can still read them off the network) and no web
 * technology can block an OS-level screen capture — it removes the one-click export path and
 * makes anything captured traceable to the account that captured it.
 */
export function PdfCanvasReader({ url, watermark }: { url: string; watermark: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Held in a ref so re-renders never re-fetch, and so cleanup can destroy the worker.
  const docRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown>; destroy: () => void } | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pdfjs = await import('pdfjs-dist');
        // Served from public/ (copied by the `sync:pdf-worker` script) so the reader never
        // reaches out to a CDN — the CSP would block that anyway.
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // No credentials: the stream URL is signed and carries the grant itself, so sending
        // cookies would only add a CORS preflight the API is not set up to answer.
        const task = pdfjs.getDocument({ url });
        const doc = await task.promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc as never;
        setPageCount(doc.numPages);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (status !== 'ready' || !docRef.current) return;
    let cancelled = false;

    async function renderPage() {
      const doc = docRef.current as unknown as { getPage: (n: number) => Promise<PdfPage> };
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const pdfPage = await doc.getPage(page);
      if (cancelled) return;

      // Fit the page to the container width, capped by devicePixelRatio for a sharp render.
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const scale = (container.clientWidth - 32) / baseViewport.width;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: scale * ratio });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / ratio}px`;
      canvas.style.height = `${viewport.height / ratio}px`;

      const context = canvas.getContext('2d');
      if (!context) return;

      renderTaskRef.current?.cancel();
      const task = pdfPage.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch {
        return; // a cancelled render is normal when paging quickly
      }
      if (cancelled) return;

      drawWatermark(context, canvas.width, canvas.height, watermark, ratio);
    }

    void renderPage();
    return () => {
      cancelled = true;
    };
  }, [page, status, watermark]);

  if (status === 'loading') {
    return <div className="flex flex-1 items-center justify-center text-sm font-semibold text-white">...</div>;
  }

  if (status === 'error') {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-semibold text-red-300">
        تعذر عرض الكتاب. / Unable to display this book.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={containerRef} className="flex-1 overflow-auto bg-slate-800 p-4">
        <canvas ref={canvasRef} className="mx-auto block select-none rounded bg-white shadow-2xl" />
      </div>
      <div className="flex items-center justify-center gap-4 border-t border-slate-800 bg-slate-900 px-4 py-3 text-white">
        <button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-full p-2 text-slate-300 hover:bg-slate-800 disabled:text-slate-600"
        >
          <ChevronRight size={20} />
        </button>
        <span className="text-sm font-semibold tabular-nums">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="rounded-full p-2 text-slate-300 hover:bg-slate-800 disabled:text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  );
}

interface PdfPage {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
    promise: Promise<void>;
    cancel: () => void;
  };
}

/** Tiled diagonal watermark, drawn into the page canvas so a screenshot carries it too. */
function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number, label: string, ratio: number) {
  context.save();
  context.globalAlpha = 0.14;
  context.fillStyle = '#0f172a';
  context.font = `${14 * ratio}px sans-serif`;
  context.textAlign = 'center';
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 6);

  const stepX = 260 * ratio;
  const stepY = 120 * ratio;
  const spread = Math.max(width, height);

  for (let x = -spread; x < spread; x += stepX) {
    for (let y = -spread; y < spread; y += stepY) {
      context.fillText(label, x, y);
    }
  }

  context.restore();
}
