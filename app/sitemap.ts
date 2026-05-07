import type { MetadataRoute } from "next";
import { coreServiceHighlights } from "@/content/core-services";
import { blogPosts, siteConfig } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/domain",
    "/dashboard/domains",
    "/dashboard/dns",
    "/reviews",
    "/case-studies",
    "/contact",
    "/blog"
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/contact" ? 0.9 : 0.8
  }));

  const serviceRoutes = coreServiceHighlights.map((service) => ({
    url: `${siteConfig.url}${service.href}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes].sort((a, b) =>
    a.url.localeCompare(b.url)
  );
}
