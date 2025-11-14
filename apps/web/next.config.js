/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kontecst/shared', '@kontecst/database'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  webpack: (config, { isServer }) => {
    // Ensure proper chunk naming and loading
    if (!isServer) {
      config.output = config.output || {}
      config.output.publicPath = config.output.publicPath || '/_next/'
    }
    return config
  },
}

module.exports = nextConfig
