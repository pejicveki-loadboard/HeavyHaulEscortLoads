import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — HeavyHaul Escort Loads",
  description:
    "News and guidance for pilot car companies and load managers using HeavyHaul Escort Loads.",
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div className="flex flex-col items-start gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={168}
            height={64}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <h1 className="text-3xl font-semibold text-brand-text">Blog</h1>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-2 rounded-lg border border-brand-border bg-brand-panel p-6 transition-colors duration-150 hover:border-brand-accent"
          >
            <p className="text-sm text-brand-muted">{formatDate(post.date)}</p>
            <h2 className="text-xl font-semibold text-brand-text">{post.title}</h2>
            <p className="text-brand-muted">{post.excerpt}</p>
            <span className="text-sm font-semibold text-brand-accent">Read more →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
