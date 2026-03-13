/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/orpc/:path*",
        destination: "/api/orpc",
      },
    ];
  },
};

export default nextConfig;
