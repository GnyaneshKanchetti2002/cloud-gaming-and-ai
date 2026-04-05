/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                // This is the "Fake" path the user sees
                source: '/api/stream-proxy/:path*',
                // This is the "Real" secret path only the server knows
                destination: 'https://desktop-d824dd9.tailb6e984.ts.net/:path*',
            },
        ]
    },
}

module.exports = nextConfig