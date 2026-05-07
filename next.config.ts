import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: []
  },
  async redirects() {
    return [
      { source: "/crm-erp-solutions", destination: "/crm-systems", permanent: true },
      { source: "/crm-erp-system", destination: "/crm-systems", permanent: true },
      { source: "/saas-development", destination: "/web-mobile-development", permanent: true },
      { source: "/mobile-app-development", destination: "/web-mobile-development", permanent: true },
      { source: "/web-development", destination: "/web-mobile-development", permanent: true },
      { source: "/mvp-development", destination: "/web-mobile-development", permanent: true },
      { source: "/ai-chatbots", destination: "/ai-automation", permanent: true },
      { source: "/workflow-automation", destination: "/ai-automation", permanent: true },
      { source: "/lead-follow-up-automation", destination: "/ai-automation", permanent: true },
      { source: "/voice-ai-calling-system", destination: "/ai-automation", permanent: true },
      { source: "/whatsapp-booking-system", destination: "/ai-automation", permanent: true },
      { source: "/service-business-automation", destination: "/ai-automation", permanent: true },
      { source: "/call-intelligence-platform", destination: "/ai-automation", permanent: true },
      { source: "/knowledge-base-ai", destination: "/ai-automation", permanent: true },
      { source: "/document-processing-ai", destination: "/ai-automation", permanent: true },
      { source: "/custom-software-development", destination: "/custom-software", permanent: true },
      { source: "/hospital-appointment-system", destination: "/custom-software", permanent: true },
      { source: "/real-estate-lead-management", destination: "/crm-systems", permanent: true },
      { source: "/domain", destination: "/services", permanent: true },
      { source: "/dashboard/domains", destination: "/services", permanent: true },
      { source: "/dashboard/dns", destination: "/services", permanent: true }
    ];
  }
};

export default nextConfig;
