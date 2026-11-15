import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dev's Duolingo avatar, rendered by Duolingo's CDN (About page streak card).
    remotePatterns: [
      { protocol: "https", hostname: "d3gq3s1iyyx31w.cloudfront.net", pathname: "/static/render/**" },
      // Learnr's App Store icon (About page Learnr card).
      { protocol: "https", hostname: "is1-ssl.mzstatic.com", pathname: "/image/thumb/**" },
    ],
  },
};

export default nextConfig;
