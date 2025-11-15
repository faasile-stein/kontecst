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

    // Externalize PDF parsing libraries for server-side to avoid webpack bundling issues
    if (isServer) {
      // Add pdf-parse and its dependencies as externals to prevent webpack from bundling them
      const externals = ['pdf-parse', 'pdfjs-dist', 'canvas']

      if (Array.isArray(config.externals)) {
        config.externals.push(...externals)
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = async (context, request, callback) => {
          if (externals.includes(request)) {
            return callback(null, `commonjs ${request}`)
          }
          return originalExternals(context, request, callback)
        }
      } else {
        config.externals = externals
      }
    }

    return config
  },
}

module.exports = nextConfig
