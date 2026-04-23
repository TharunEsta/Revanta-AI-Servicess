import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: readonly string[];
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = []
}: MetadataInput): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  const canonical = absoluteUrl(path);

  return {
    title: fullTitle,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      url: canonical,
      siteName: siteConfig.name
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description
    }
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN"
    },
    sameAs: siteConfig.socials.map((social) => social.href),
    description: siteConfig.description
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    }
  };
}

export function serviceSchema(serviceName: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${serviceName} by ${siteConfig.name}`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: serviceName,
    description,
    url: absoluteUrl(path)
  };
}

type ReviewSchemaInput = {
  id: string;
  fullName: string;
  companyName: string;
  role: string;
  rating: number;
  reviewText: string;
  serviceUsed: string;
  projectType: string;
  approvedAt?: string;
  submittedAt: string;
};

export function reviewsPageSchema(reviews: ReviewSchemaInput[]) {
  const itemListElements = reviews.map((review, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.fullName
      },
      reviewBody: review.reviewText,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      itemReviewed: {
        "@type": "Service",
        name: `${review.serviceUsed} - ${review.projectType}`,
        provider: {
          "@type": "Organization",
          name: siteConfig.name
        }
      },
      publisher: {
        "@type": "Organization",
        name: review.companyName
      },
      datePublished: review.approvedAt ?? review.submittedAt
    }
  }));

  const baseSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Client Feedback & Project Reviews | ${siteConfig.name}`,
    url: absoluteUrl("/reviews"),
    description: "Verified experiences from businesses who worked with Revanta AI.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: itemListElements
    }
  };

  if (reviews.length > 0) {
    const averageRating = Number(
      (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    );

    baseSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1
    };
  }

  return baseSchema;
}
