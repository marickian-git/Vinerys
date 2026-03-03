/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
  remotePatterns: [
    { protocol: 'http', hostname: 'casa-spiridus.go.ro', port: '9010' }
  ]
}, 
  output: 'standalone',
};

export default nextConfig;
