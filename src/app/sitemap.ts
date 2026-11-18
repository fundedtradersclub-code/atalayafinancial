import type { MetadataRoute } from "next";

const BASE = "https://atalayafinancial.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-11-18");
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/manual`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/manual/en`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/fuentes`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/reclamos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
