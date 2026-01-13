import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/x9FQ7mP2KZrA8vWcT4HnL6EJdYB5sUeR" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/x9FQ7mP2KZrA8vWcT4HnL6EJdYB5sUeR" : "",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
