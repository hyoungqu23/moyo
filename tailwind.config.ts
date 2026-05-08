import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4ede0",
        "paper-2": "#fbf6ec",
        "paper-3": "#ece2cf",
        ink: "#241a10",
        "ink-soft": "#3a2c1d",
        "ink-muted": "#7d6f5e",
        "ink-faint": "#a99c89",
        persimmon: "#c2410c",
        "persimmon-soft": "#e87d3e",
        sage: "#7a8a6b",
        hairline: "#e3d9c8",
        "hairline-strong": "#cdbfa6",
        danger: "#a23b1f",
        // legacy aliases kept for any straggling refs
        primary: "#c2410c",
        "primary-focus": "#a8350a",
        canvas: "#fbf6ec",
        parchment: "#f4ede0",
        pearl: "#fbf6ec",
        tile: "#241a10",
        "tile-2": "#3a2c1d",
        "tile-3": "#241a10",
        "body-muted": "#a99c89",
        "primary-on-dark": "#e87d3e",
      },
      fontFamily: {
        sans: [
          "var(--font-brush)",
          "Nanum Brush Script",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-gowun)",
          "Gowun Batang",
          "var(--font-brush)",
          "Nanum Brush Script",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-brush)",
          "Nanum Brush Script",
          "ui-monospace",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        wider: "0.08em",
      },
      borderRadius: {
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "12px",
      },
      maxWidth: {
        content: "480px",
        prosewide: "640px",
      },
      boxShadow: {
        page: "0 1px 0 rgba(36, 26, 16, 0.04), 0 6px 16px -8px rgba(36, 26, 16, 0.18)",
        ink: "0 0 0 1px rgba(36, 26, 16, 0.06), 0 2px 8px -4px rgba(36, 26, 16, 0.18)",
        product: "0 8px 24px -10px rgba(36, 26, 16, 0.35)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "rise-in": "riseIn 360ms cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
