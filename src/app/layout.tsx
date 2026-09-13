import type { Metadata } from 'next';
import { Alexandria } from 'next/font/google';
import { getApiOrigin } from '@/lib/api/base-fetch';
import './globals.css';
import { Providers } from './providers';

const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-alexandria',
});

export const metadata: Metadata = {
  title: 'B3 Academy',
  description: 'Academy of Natural Philosophy and Psychedelics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Warm the TCP+TLS connection to the API origin. Nearly every page fetches from
  // it on mount, and because the app is almost entirely client-rendered those
  // requests can only start after hydration — so the handshake is otherwise paid
  // serially on the critical path of the first real request.
  // (vercel-react-best-practices: rendering-resource-hints)
  const apiOrigin = getApiOrigin();

  return (
    <html lang="ar" dir="rtl" className={alexandria.variable}>
      {/* Plain <link> rather than react-dom's preconnect(): that would require
          adding @types/react-dom, and React 19 hoists this into <head> anyway.
          crossOrigin="anonymous" matches how apiFetch actually requests
          (credentials: 'omit' + a bearer header) — a mismatched credentials mode
          would open a second connection and waste the hint entirely. */}
      {apiOrigin ? <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" /> : null}
      <body className={alexandria.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
