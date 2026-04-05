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
    async headers() {
        return [
            {
                source: '/api/stream-proxy/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: "frame-ancestors *; frame-src *; default-src * 'unsafe-inline' 'unsafe-eval'; connect-src *;" },
                    // Cross-Origin Isolation headers (Required for low-latency streaming)
                    { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
                    { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                ],
            },
        ]
    }
}

module.exports = nextConfig