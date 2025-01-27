/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Add any webpack customizations if needed
        return config
    },
    // Ensure proper transpilation
    transpilePackages: [],
    // Improve module resolution
    poweredByHeader: false,
    reactStrictMode: true,
}

module.exports = nextConfig 