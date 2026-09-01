import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} — HeavyHaul Escort Loads`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
      images: [{ url: "/logo-horizontal.png", width: 168, height: 64 }],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.excerpt,
      images: ["/logo-horizontal.png"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
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

      <article className="flex flex-col gap-4 rounded-lg border border-brand-border bg-brand-panel p-6">
        <div>
          <Link
            href="/blog"
            className="text-sm text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
          >
            &larr; Back to blog
          </Link>
        </div>
        <h1 className="text-3xl font-semibold text-brand-text">{post.title}</h1>
        <p className="text-sm text-brand-muted">{formatDate(post.date)}</p>

        {post.body.map((paragraph, index) => (
          <p key={index} className="text-brand-text">
            {paragraph}
          </p>
        ))}

        {post.cta && (
          <Link
            href={post.cta.href}
            className="mt-2 inline-block w-fit rounded bg-brand-accent px-4 py-2 text-center font-semibold text-brand-accent-text transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep"
          >
            {post.cta.label}
          </Link>
        )}
      </article>
    </main>
  );
}
