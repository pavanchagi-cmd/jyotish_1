import type { Config } from "tailwindcss";

/**
 * Design tokens ported from /design (see spec section 7).
 * Loaded by app/globals.css through Tailwind v4's `@config` directive.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#14112B",
        surface: "#221E42",
        border: "#3A3466",
        nav: "#1B1838",
        "nav-border": "#332D5C",
        divider: "#2E2856",
        text: "#F4F1FF",
        "text-soft": "#DDD9F2",
        muted: "#B8B3D6",
        accent: "#F5A524",
        "accent-hover": "#FFC861",
        "accent-ink": "#1A1405",
        "warm-surface": "#2A2410",
        "warm-strong": "#3A2E1A",
        "warm-border": "#5C4A1A",
        "warm-text": "#FFD58A",
        "warm-soft": "#F1E6CC",
        "chart-paper": "#F6EEDC",
        "chart-ink": "#5B3A12",
        "chart-label": "#7A5A2E",
        "chart-planet": "#2A1A05",
      },
      borderRadius: {
        input: "12px",
        card: "16px",
        "card-lg": "18px",
      },
      fontFamily: {
        heading: ["var(--font-philosopher)", "Georgia", "serif"],
        body: ["var(--font-hind)", "var(--font-kannada)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
};

export default config;
