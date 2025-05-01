/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['127.0.0.1', 'your-production-domain.com', 'lh3.googleusercontent.com', 'storage.googleapis.com'], // Add your actual production domain when deploying
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
      // Add more remote patterns as needed for production
    ],
  },
}

module.exports = nextConfig
