import { ReviewRecord } from "@/lib/reviews";

function formatReviewDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(dateValue));
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewCard({ review }: { review: ReviewRecord }) {
  const publishedDate = review.approvedAt ?? review.submittedAt;

  return (
    <article className="panel flex h-full flex-col justify-between p-6 sm:p-7">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {review.profileImageUrl ? (
              <img
                src={review.profileImageUrl}
                alt={review.fullName}
                className="h-14 w-14 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {getInitials(review.fullName)}
              </div>
            )}
            <div>
              <p className="font-[var(--font-display)] text-lg font-semibold text-slate-950">
                {review.fullName}
              </p>
              <p className="text-sm text-slate-600">
                {review.role}, {review.companyName}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Verified Client
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex gap-1 text-lg text-amber-400" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index}>{index < review.rating ? "★" : "☆"}</span>
            ))}
          </div>
          <p className="text-sm text-slate-500">{formatReviewDate(publishedDate)}</p>
        </div>

        <p className="mt-5 text-base leading-8 text-slate-600">{review.reviewText}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {review.serviceUsed}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {review.projectType}
        </span>
      </div>
    </article>
  );
}
