/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // パフォーマンス最適化
  swcMinify: true, // SWCベースのminificationを有効化

  // 開発環境のコンパイル最適化
  experimental: {
    // Turbopack使用時はtypedRoutesを無効化
    // typedRoutes: true,
    // 開発環境でのコンパイル最適化
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
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
