import { normalizeBasePath } from './utils/appPath.mjs';

/** @type {import('next').NextConfig} */
const basePath = normalizeBasePath(process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? '');

const nextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_URL: basePath,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '',
    NEXT_PUBLIC_MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL ?? 'https://casa-spiridus.go.ro/minio',
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'casa-spiridus.go.ro', port: '9010' }
    ]
  },
  output: 'standalone',
};

export default nextConfig;
