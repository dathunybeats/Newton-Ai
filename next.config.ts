import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      'pdfjs-dist/build/pdf': 'pdfjs-dist/legacy/build/pdf',
      'pdfjs-dist/build/pdf.worker': 'pdfjs-dist/legacy/build/pdf.worker',
    },
  },
  webpack: (config) => {
    // Alias pdfjs-dist to use the legacy build for Node.js compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf': 'pdfjs-dist/legacy/build/pdf',
      'pdfjs-dist/build/pdf.worker': 'pdfjs-dist/legacy/build/pdf.worker',
    };
    return config;
  },
};

export default nextConfig;
