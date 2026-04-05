/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/stream-proxy/:path*',
                destination: 'https://desktop-d824dd9.tailb6e984.ts.net/:path*',
            },
        ]
    },
    // Adding this allows the iframe to load across different security headers
    async headers() {
        return [
            {
                source: '/api/stream-proxy/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://cloud-gaming-and-ai.vercel.app" },
                ],
            },
        ]
    }
}

module.exports = nextConfig