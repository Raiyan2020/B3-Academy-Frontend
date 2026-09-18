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
    // `lang`/`dir` are the Arabic default. The real preference lives in localStorage,
    // which the server cannot read, and LanguageProvider only corrects the element after
    // mount *and* after the locale chunk resolves — so a non-Arabic visitor saw the whole
    // page laid out RTL until then. Reading the preference from a cookie in this layout
    // would fix the markup but opt every page out of static rendering; the script below
    // runs before first paint instead, so the correction costs nothing and is never seen.
    <html lang="ar" dir="rtl" className={alexandria.variable}>
      {/* The script must sit inside <head>: a sync <script> as a direct child of
          <html> has no defined order, so React cannot render it and warns. */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            // A fixed string with no interpolation, and it only honours a value from the
            // known locale set — localStorage is not a trusted input.
            __html: `try{var l=localStorage.getItem('b3_lang');if(l==='en'||l==='fr'||l==='es'){document.documentElement.lang=l;document.documentElement.dir='ltr'}}catch(e){}`,
          }}
        />
        {/* Plain <link> rather than react-dom's preconnect(): that would require
            adding @types/react-dom. crossOrigin="anonymous" matches how apiFetch
            actually requests (credentials: 'omit' + a bearer header) — a mismatched
            credentials mode would open a second connection and waste the hint entirely. */}
        {apiOrigin ? <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" /> : null}
      </head>
      <body className={alexandria.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
