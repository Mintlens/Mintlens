import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@mintlens/shared'],
}

export default nextConfig
