import Link from "next/link";
import { ReviewCard } from "@/components/review-card";
import { ReviewRequestForm } from "@/components/review-request-form";
import { StructuredData } from "@/components/structured-data";
import { buildMetadata, reviewsPageSchema } from "@/lib/seo";
import { getReviewsPageData, type ReviewSort } from "@/lib/reviews";
import { Card, CtaBanner, PageHero } from "@/components/ui";

export const metadata = buildMetadata({
  title: "Client Feedback & Project Reviews",
  description: "Verified experiences from businesses who worked with Revanta AI.",
  path: "/reviews",
  keywords: ["client reviews Revanta AI", "project reviews Revanta AI", "verified software reviews"]
});

type ReviewsPageProps = {
  searchParams?: Promise<{
    sort?: string;
    page?: string;
  }>;
};

function isReviewSort(value: string | undefined): value is ReviewSort {
  return value === "newest" || value === "highest" || value === "oldest";
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = (await searchParams) ?? {};
  const sort = isReviewSort(params.sort) ? params.sort : "newest";
  const parsedPage = Number(params.page ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const reviewData = await getReviewsPageData({
    sort,
    page,
    pageSize: 6
  });

  const createLink = (nextSort: ReviewSort, nextPage = 1) => {
    const query = new URLSearchParams({
      sort: nextSort,
      page: String(nextPage)
    });

    return `/reviews?${query.toString()}`;
  };

  return (
    <main>
      <StructuredData data={reviewsPageSchema(reviewData.reviews)} />

      <PageHero
        eyebrow="Reviews"
        title="Client Feedback & Project Reviews"
        description="Feedback from businesses that worked with Revanta AI on websites, systems, and software."
        primaryCta={{ label: "Book Consultation", href: "/contact" }}
        secondaryCta={{ label: "Explore Services", href: "/services" }}
      />

      <section className="section pt-8">
        <div className="shell grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <Card className="bg-slate-50">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Review summary</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-[var(--font-display)] text-5xl font-semibold text-slate-950">
                {reviewData.averageRating.toFixed(1)}
              </span>
              <span className="pb-1 text-sm text-slate-500">out of 5</span>
            </div>
            <div className="mt-4 flex gap-1 text-xl text-amber-400">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index}>
                  {index < Math.round(reviewData.averageRating) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {reviewData.totalCount} verified review{reviewData.totalCount === 1 ? "" : "s"}
            </p>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-medium text-slate-700">Sort reviews</p>
              <div className="flex flex-wrap gap-3">
                {(["newest", "highest", "oldest"] as ReviewSort[]).map((option) => (
                  <Link
                    key={option}
                    href={createLink(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      reviewData.sort === option
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {option === "newest"
                      ? "Newest"
                      : option === "highest"
                        ? "Highest Rating"
                        : "Oldest"}
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {reviewData.reviews.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {reviewData.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {reviewData.totalPages > 1 ? (
                  <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-sm text-slate-600">
                      Page {reviewData.currentPage} of {reviewData.totalPages}
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href={createLink(reviewData.sort, Math.max(1, reviewData.currentPage - 1))}
                        className={`button-secondary ${
                          reviewData.currentPage === 1 ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        Previous
                      </Link>
                      <Link
                        href={createLink(
                          reviewData.sort,
                          Math.min(reviewData.totalPages, reviewData.currentPage + 1)
                        )}
                        className={`button-secondary ${
                          reviewData.currentPage === reviewData.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        Next
                      </Link>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <Card className="bg-slate-50">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Founder-led work. Clear communication. Real follow-through.
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-950">
                  Reviews will be added as client projects are completed
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Until then, the standard stays the same: practical systems, faster communication,
                  and work built around the business outcome.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    "Founder-led delivery",
                    "Clear communication",
                    "Reliable execution",
                    "Long-term support"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-slate-50">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Future Review Requests</p>
            <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-950">
              Keep the review process ready for completed projects
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This form is for collecting future review requests once a client project is complete
              and ready for written feedback.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                EmailJS delivery
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                React state forms
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                Review collection ready
              </div>
            </div>
          </Card>

          <ReviewRequestForm />
        </div>
      </section>

      <CtaBanner />
    </main>
  );
}
