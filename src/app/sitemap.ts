import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Only the three public routes are indexed. /test and /legacy are internal
// scaffolding and are kept out of the sitemap (and blocked in robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/play`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
