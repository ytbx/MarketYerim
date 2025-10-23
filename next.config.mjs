/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 🔥 TÜM SAYFALARI DİNAMİK HALE GETİR
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // varsa server actions limitini de genişlet
    },
  },

  // ⚙️ Pre-render hatalarını önlemek için
  generateStaticParams: () => [],
  output: 'standalone', // Vercel uyumlu
};

export default nextConfig;
