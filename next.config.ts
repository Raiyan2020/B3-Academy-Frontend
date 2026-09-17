import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Still reachable seed data (src/data.ts, care-schedule-config.service.ts) serves
      // placeholder covers and clinic photos from here; removing it blanks those images.
      // Drop this entry once that data is replaced with real content.
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'raiyansoft.com' },
      { protocol: 'https', hostname: 'nader32.com' },
      { protocol: 'https', hostname: 'portal.b3.raiyan.cc' },
    ],
  },
};

export default nextConfig;
