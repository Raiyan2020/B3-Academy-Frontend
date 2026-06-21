import type { Metadata } from 'next';
import { Alexandria } from 'next/font/google';
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
  return (
    <html lang="ar" dir="rtl" className={alexandria.variable}>
      <body className={alexandria.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
