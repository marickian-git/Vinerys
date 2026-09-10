import { normalizeBasePath } from './utils/appPath.mjs';

/** @type {import('next').NextConfig} */
const basePath = normalizeBasePath(process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? '');

const nextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_URL: basePath,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '',
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'casa-spiridus.go.ro', port: '9010' }
    ]
  },
  output: 'standalone',
};

export default nextConfig;
