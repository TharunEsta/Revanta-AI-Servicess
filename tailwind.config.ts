import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        panel: "#ffffff",
        line: "#e5e7eb",
        brand: "#111111",
        sand: "#f8f8f8",
        mist: "#f5f5f5",
        gold: "#c08438"
      },
      boxShadow: {
        glow: "0 18px 48px rgba(17, 17, 17, 0.08)",
        soft: "0 10px 30px rgba(17, 17, 17, 0.06)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(17,17,17,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
