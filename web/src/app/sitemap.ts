import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog-posts";

const BASE_URL = "https://app.heavyhaulescortloads.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/pricing", "/faq", "/blog", "/contact", "/privacy", "/terms"];

  const staticEntries = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));

  const postEntries = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00`),
  }));

  return [...staticEntries, ...postEntries];
}
