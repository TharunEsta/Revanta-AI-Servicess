import Link from "next/link";
import { blogPosts } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Read insights from Revanta AI on AI automation, SaaS development, premium websites, and scalable software systems.",
  path: "/blog"
});

export default function BlogPage() {
  return (
    <main>
      <PageHero
        eyebrow="Blog"
        title="High-signal writing on AI systems, software, and premium growth positioning."
        description="The Revanta AI blog supports branded search, topical authority, and commercial-intent content across the company's core services."
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card key={post.slug}>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{post.category}</p>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                {post.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{post.summary}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>{post.readingTime}</span>
                <span>{post.publishedAt}</span>
              </div>
              <Link href={`/blog/${post.slug}`} className="mt-8 button-primary w-fit">
                Read Article
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
