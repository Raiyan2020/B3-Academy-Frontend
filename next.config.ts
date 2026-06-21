import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'raiyansoft.com' },
      { protocol: 'https', hostname: 'nader32.com' },
    ],
  },
};

export default nextConfig;
