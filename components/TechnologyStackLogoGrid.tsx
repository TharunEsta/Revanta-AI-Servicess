import Image from "next/image";

type Logo = { name: string; src: string };

const techLogos: Logo[] = [
  { name: "Google Cloud", src: "/technology-logos/google-cloud.svg" },
  { name: "AWS", src: "/technology-logos/aws.svg" },
  { name: "Meta", src: "/technology-logos/meta.svg" },
  { name: "Vercel", src: "/technology-logos/vercel.svg" },
  { name: "Cloudflare", src: "/technology-logos/cloudflare.svg" },
  { name: "Supabase", src: "/technology-logos/supabase.svg" },

  { name: "PostgreSQL", src: "/technology-logos/postgresql.svg" },
  { name: "Stripe", src: "/technology-logos/stripe.svg" },
  { name: "Razorpay", src: "/technology-logos/razorpay.svg" },
  { name: "GitHub", src: "/technology-logos/github.svg" },
  { name: "Docker", src: "/technology-logos/docker.svg" },
  { name: "Next.js", src: "/technology-logos/nextjs.svg" },

  { name: "React", src: "/technology-logos/react.svg" },
  { name: "TypeScript", src: "/technology-logos/typescript.svg" },
  { name: "Node.js", src: "/technology-logos/nodejs.svg" },
  { name: "OpenAI", src: "/technology-logos/openai.svg" },
  { name: "Anthropic", src: "/technology-logos/anthropic.svg" },
  { name: "Python", src: "/technology-logos/python.svg" },

  { name: "Java", src: "/technology-logos/java.svg" },
  { name: "Spring Boot", src: "/technology-logos/spring-boot.svg" },
  { name: "C#", src: "/technology-logos/csharp.svg" },
  { name: ".NET", src: "/technology-logos/dotnet.svg" },
  { name: "Flutter", src: "/technology-logos/flutter.svg" },
  { name: "MongoDB", src: "/technology-logos/mongodb.svg" },

  { name: "MySQL", src: "/technology-logos/mysql.svg" },
  { name: "Redis", src: "/technology-logos/redis.svg" }
];

export function TechnologyStackLogoGrid() {
  return (
    <section className="section pb-10 pt-10">
      <div className="shell">
        <h2 className="text-left font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
          Technology Stack
        </h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-6 md:grid-cols-4 grid-cols-3 sm:grid-cols-2">
          {techLogos.map((logo) => (
            <div
              key={logo.name}
              className="flex min-h-[86px] items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white p-5"
              aria-label={logo.name}
            >
              <Image src={logo.src} alt={logo.name} width={64} height={64} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


