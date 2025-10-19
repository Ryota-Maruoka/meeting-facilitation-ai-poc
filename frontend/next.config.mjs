/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    // 環境変数またはデフォルト値を使用
    const backendUrl = process.env.BACKEND_API_URL || 'http://54.250.241.155:8000';

    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
