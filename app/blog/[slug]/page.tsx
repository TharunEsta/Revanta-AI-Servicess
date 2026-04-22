import { notFound } from "next/navigation";
import { blogPosts } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { Card, PageHero } from "@/components/ui";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((item) => item.slug === params.slug);

  if (!post) {
    return {};
  }

  return buildMetadata({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((item) => item.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main>
      <PageHero
        eyebrow={post.category}
        title={post.title}
        description={post.summary}
        primaryCta={{ label: "Start Project", href: "/contact" }}
      />

      <section className="section pt-8">
        <div className="shell">
          <Card className="mx-auto max-w-4xl">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span>{post.publishedAt}</span>
              <span>{post.readingTime}</span>
            </div>
            <div className="mt-8 space-y-6">
              {post.content.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
