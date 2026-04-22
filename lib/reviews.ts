export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewSort = "newest" | "highest" | "oldest";

export type ReviewRecord = {
  id: string;
  fullName: string;
  companyName: string;
  role: string;
  email: string;
  rating: number;
  serviceUsed: string;
  projectType: string;
  reviewText: string;
  permissionToPublish: boolean;
  profileImageUrl?: string;
  status: ReviewStatus;
  verifiedClient: boolean;
  submittedAt: string;
  approvedAt?: string;
};

type SupabaseReviewRow = {
  id: string;
  full_name: string;
  company_name: string;
  role: string;
  email: string;
  rating: number;
  service_used: string;
  project_type: string;
  review_text: string;
  permission_to_publish: boolean;
  profile_image_url: string | null;
  status: ReviewStatus;
  verified_client: boolean;
  submitted_at: string;
  approved_at: string | null;
};

export type ReviewSubmissionInput = {
  fullName: string;
  companyName: string;
  role: string;
  email: string;
  rating: number;
  serviceUsed: string;
  projectType: string;
  reviewText: string;
  permissionToPublish: boolean;
  profileImageUrl?: string;
};

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function hasSupabaseReadConfig() {
  return Boolean(getEnv("SUPABASE_URL") && (getEnv("SUPABASE_ANON_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY")));
}

function hasSupabaseAdminConfig() {
  return Boolean(getEnv("SUPABASE_URL") && getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function getSupabaseUrl() {
  const url = getEnv("SUPABASE_URL");
  if (!url) {
    throw new Error("SUPABASE_URL is not configured.");
  }
  return url.replace(/\/+$/, "");
}

function getSupabaseAdminKey() {
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return key;
}

function getSupabaseReadKey() {
  return getEnv("SUPABASE_ANON_KEY") || getSupabaseAdminKey();
}

function getReviewsEndpoint(query = "") {
  return `${getSupabaseUrl()}/rest/v1/reviews${query}`;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function mapRowToReview(row: SupabaseReviewRow): ReviewRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    companyName: row.company_name,
    role: row.role,
    email: row.email,
    rating: row.rating,
    serviceUsed: row.service_used,
    projectType: row.project_type,
    reviewText: row.review_text,
    permissionToPublish: row.permission_to_publish,
    profileImageUrl: row.profile_image_url ?? undefined,
    status: row.status,
    verifiedClient: row.verified_client,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at ?? undefined
  };
}

function mapSubmissionToRow(input: ReviewSubmissionInput) {
  return {
    full_name: input.fullName,
    company_name: input.companyName,
    role: input.role,
    email: input.email,
    rating: input.rating,
    service_used: input.serviceUsed,
    project_type: input.projectType,
    review_text: input.reviewText,
    permission_to_publish: input.permissionToPublish,
    profile_image_url: input.profileImageUrl ?? null,
    status: "pending" as const,
    verified_client: true
  };
}

async function supabaseFetch<T>({
  query = "",
  method = "GET",
  body,
  admin = false,
  expectSingle = false
}: {
  query?: string;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  admin?: boolean;
  expectSingle?: boolean;
}) {
  const key = admin ? getSupabaseAdminKey() : getSupabaseReadKey();
  const response = await fetch(getReviewsEndpoint(query), {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: expectSingle ? "return=representation" : "return=minimal"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase request failed.");
  }

  if (method === "GET" || expectSingle) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

function sortReviews(reviews: ReviewRecord[], sort: ReviewSort) {
  return [...reviews].sort((left, right) => {
    if (sort === "highest") {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }
      return (
        new Date(right.approvedAt ?? right.submittedAt).getTime() -
        new Date(left.approvedAt ?? left.submittedAt).getTime()
      );
    }

    if (sort === "oldest") {
      return (
        new Date(left.approvedAt ?? left.submittedAt).getTime() -
        new Date(right.approvedAt ?? right.submittedAt).getTime()
      );
    }

    return (
      new Date(right.approvedAt ?? right.submittedAt).getTime() -
      new Date(left.approvedAt ?? left.submittedAt).getTime()
    );
  });
}

export function validateReviewSubmission(input: ReviewSubmissionInput) {
  const normalized: ReviewSubmissionInput = {
    fullName: normalizeWhitespace(input.fullName),
    companyName: normalizeWhitespace(input.companyName),
    role: normalizeWhitespace(input.role),
    email: normalizeWhitespace(input.email).toLowerCase(),
    rating: Number(input.rating),
    serviceUsed: normalizeWhitespace(input.serviceUsed),
    projectType: normalizeWhitespace(input.projectType),
    reviewText: normalizeWhitespace(input.reviewText),
    permissionToPublish: Boolean(input.permissionToPublish),
    profileImageUrl: input.profileImageUrl ? normalizeWhitespace(input.profileImageUrl) : undefined
  };

  if (!normalized.fullName || normalized.fullName.length < 2) {
    throw new Error("Please enter the client's full name.");
  }

  if (!normalized.companyName || normalized.companyName.length < 2) {
    throw new Error("Please enter the company name.");
  }

  if (!normalized.role || normalized.role.length < 2) {
    throw new Error("Please enter the role or position.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!Number.isInteger(normalized.rating) || normalized.rating < 1 || normalized.rating > 5) {
    throw new Error("Please choose a rating between 1 and 5.");
  }

  if (!normalized.serviceUsed || normalized.serviceUsed.length < 2) {
    throw new Error("Please specify the service used.");
  }

  if (!normalized.projectType || normalized.projectType.length < 2) {
    throw new Error("Please specify the project type.");
  }

  if (!normalized.reviewText || normalized.reviewText.length < 40) {
    throw new Error("Please provide a more detailed review.");
  }

  if (normalized.reviewText.length > 2000) {
    throw new Error("Review text is too long.");
  }

  if (!normalized.permissionToPublish) {
    throw new Error("Public publishing permission is required.");
  }

  return normalized;
}

export async function submitReview(input: ReviewSubmissionInput) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase review storage is not configured yet.");
  }

  const validated = validateReviewSubmission(input);
  const rows = await supabaseFetch<SupabaseReviewRow[]>({
    method: "POST",
    body: mapSubmissionToRow(validated),
    admin: true,
    expectSingle: true
  });

  return mapRowToReview(rows[0]);
}

export async function moderateReview(reviewId: string, action: "approve" | "reject") {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase review moderation is not configured yet.");
  }

  const rows = await supabaseFetch<SupabaseReviewRow[]>({
    query: `?id=eq.${encodeURIComponent(reviewId)}`,
    method: "PATCH",
    body:
      action === "approve"
        ? { status: "approved", approved_at: new Date().toISOString() }
        : { status: "rejected", approved_at: null },
    admin: true,
    expectSingle: true
  });

  if (!rows.length) {
    throw new Error("Review not found.");
  }

  return mapRowToReview(rows[0]);
}

export async function getApprovedReviews() {
  if (!hasSupabaseReadConfig()) {
    return [];
  }

  const rows = await supabaseFetch<SupabaseReviewRow[]>({
    query:
      "?status=eq.approved&select=id,full_name,company_name,role,email,rating,service_used,project_type,review_text,permission_to_publish,profile_image_url,status,verified_client,submitted_at,approved_at",
    admin: false
  });

  return rows.map(mapRowToReview);
}

export async function getFeaturedReviews(limit = 3) {
  const approved = await getApprovedReviews();
  return sortReviews(approved, "newest").slice(0, limit);
}

export async function getReviewsPageData({
  sort = "newest",
  page = 1,
  pageSize = 6
}: {
  sort?: ReviewSort;
  page?: number;
  pageSize?: number;
}) {
  const approved = await getApprovedReviews();
  const sorted = sortReviews(approved, sort);
  const totalCount = sorted.length;
  const averageRating = totalCount
    ? Number((sorted.reduce((sum, review) => sum + review.rating, 0) / totalCount).toFixed(1))
    : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    reviews: paginated,
    totalCount,
    averageRating,
    totalPages,
    currentPage,
    sort
  };
}

export async function sendReviewSubmissionNotification(review: ReviewRecord) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  const notificationTo = getEnv("REVIEW_NOTIFICATION_TO_EMAIL");
  const notificationFrom = getEnv("REVIEW_NOTIFICATION_FROM_EMAIL") || "reviews@revantaai.com";

  if (!resendApiKey || !notificationTo) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: notificationFrom,
      to: [notificationTo],
      subject: `New review submission from ${review.fullName}`,
      html: `
        <h2>New review submitted</h2>
        <p><strong>Name:</strong> ${review.fullName}</p>
        <p><strong>Company:</strong> ${review.companyName}</p>
        <p><strong>Role:</strong> ${review.role}</p>
        <p><strong>Email:</strong> ${review.email}</p>
        <p><strong>Rating:</strong> ${review.rating}/5</p>
        <p><strong>Service:</strong> ${review.serviceUsed}</p>
        <p><strong>Project Type:</strong> ${review.projectType}</p>
        <p><strong>Review:</strong></p>
        <p>${review.reviewText}</p>
        <p><strong>Status:</strong> ${review.status}</p>
        <p><strong>Review ID:</strong> ${review.id}</p>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to send review submission email.");
  }
}
