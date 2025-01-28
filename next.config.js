/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Ensure proper transpilation
    transpilePackages: [
        '@supabase/auth-helpers-nextjs',
        '@supabase/auth-ui-react',
        '@supabase/auth-ui-shared'
    ],
    // Disable image optimization warning
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
}

module.exports = nextConfig 