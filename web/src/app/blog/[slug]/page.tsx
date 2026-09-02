import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BLOG_POSTS, getPostBySlug, type BlogBlock } from "@/lib/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

// No markdown renderer in this app -- body blocks carry inline **bold** /
// *italic* markers that need converting to real elements here.
function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter((part) => part.length > 0)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-brand-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
}

function BlogBody({ block, index }: { block: BlogBlock; index: number }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={index} className="mt-2 text-xl font-semibold text-brand-text">
          {renderInline(block.text)}
        </h2>
      );
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-brand-accent bg-brand-bg/40 py-2 pl-4 italic text-brand-muted"
        >
          {renderInline(block.text)}
        </blockquote>
      );
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-lg border border-brand-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg/40">
                {block.headers.map((header, hi) => (
                  <th key={hi} className="p-3 font-semibold text-brand-text">
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-brand-border last:border-0 odd:bg-brand-bg/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-3 align-top text-brand-text">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list":
      return block.ordered ? (
        <ol key={index} className="list-decimal space-y-1 pl-5 text-brand-text">
          {block.items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={index} className="list-disc space-y-1 pl-5 text-brand-text">
          {block.items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "p":
    default:
      return (
        <p key={index} className="text-brand-text">
          {renderInline(block.text)}
        </p>
      );
  }
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

        {post.body.map((block, index) => (
          <BlogBody key={index} block={block} index={index} />
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
