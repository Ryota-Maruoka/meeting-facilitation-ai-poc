/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://54.250.241.155:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
