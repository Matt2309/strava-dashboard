import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net",
                pathname: "/**",
            },
        ],
    },

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