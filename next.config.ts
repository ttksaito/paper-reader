import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack設定（Next.js 16対応）
  turbopack: {},

  webpack: (config) => {
    // PDF.jsのcanvas依存関係を外部化
    config.resolve.alias.canvas = false;

    // PDF.jsのワーカーファイルをコピー
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    return config;
  },

  // PWA対応
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
