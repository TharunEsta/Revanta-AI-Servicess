import { siGmail, siInstagram, siWhatsapp } from "simple-icons";

type SocialLink = {
  label: string;
  href: string;
  icon: { path: string; hex: string };
  external?: boolean;
};

const socialLinks: SocialLink[] = [
  {
    label: "WhatsApp",
    href: "https://wa.me/919014719422",
    icon: siWhatsapp,
    external: true
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/revanta_ai?igsh=MWJoYnNtcmNqeGNrMA%3D%3D&utm_source=qr",
    icon: siInstagram,
    external: true
  },
  {
    label: "Mail",
    href: "mailto:hello@revantaai.com",
    icon: siGmail
  }
];

function SocialIcon({ icon }: { icon: { path: string; hex: string } }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={`#${icon.hex}`} aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}

export function SocialContactLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      {socialLinks.map((item) => {
        const sharedClassName =
          "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-950";

        return item.external ? (
          <a key={item.label} href={item.href} className={sharedClassName} target="_blank" rel="noreferrer">
            <SocialIcon icon={item.icon} />
            <span>{item.label}</span>
          </a>
        ) : (
          <a key={item.label} href={item.href} className={sharedClassName}>
            <SocialIcon icon={item.icon} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
