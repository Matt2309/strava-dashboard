/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable standalone output for optimized Docker deployments
	// This generates a .next/standalone directory with only necessary files
	// Reduces image size and improves security by excluding unused dependencies
	output: 'standalone',

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
