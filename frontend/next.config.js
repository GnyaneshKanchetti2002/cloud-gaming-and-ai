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
    // This allows the Iframe to bypass "Same-Origin" security checks
    async headers() {
        return [
            {
                source: '/api/stream-proxy/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: "frame-ancestors 'self' *" },
                ],
            },
        ]
    }
}

module.exports = nextConfig