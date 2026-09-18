import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Only the API origins that actually serve uploaded images. The old
    // picsum.photos / raiyansoft.com / nader32.com entries backed mock data and
    // hotlinked artwork that no longer exists in the source.
    remotePatterns: [
      { protocol: 'https', hostname: 'portal.b3.raiyan.cc' },
      // Local backend (`php artisan serve`), which serves storage/images/* in dev.
      { protocol: 'http', hostname: '127.0.0.1', port: '8000' },
      { protocol: 'http', hostname: 'localhost', port: '8000' },
    ],
  },
};

export default nextConfig;
