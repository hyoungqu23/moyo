import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // base surfaces
        ivory: "#fdf6f0",
        "ivory-soft": "#fffaf3",
        "ivory-deep": "#f5ebdf",
        // ink
        ink: "#2a2530",
        "ink-soft": "#5d5663",
        "ink-muted": "#9a8e9b",
        "ink-faint": "#c7bdc8",
        // primary accent — dusty pink
        pink: "#f5cfd5",
        "pink-soft": "#fbe5e8",
        "pink-deep": "#d8889a",
        "pink-ink": "#9a4d5d",
        // secondary accent — mint
        mint: "#c5e1d3",
        "mint-soft": "#e3f0ea",
        "mint-deep": "#6fa388",
        "mint-ink": "#3f7558",
        // tertiary accent — lavender
        lavender: "#d4cce8",
        "lavender-soft": "#ece6f5",
        "lavender-deep": "#8a78b7",
        "lavender-ink": "#5a4d83",
        // small touch — butter for highlights
        butter: "#f9e4a0",
        "butter-deep": "#d4a850",
        // dividers
        hairline: "#ecdfd5",
        "hairline-strong": "#d8c3b5",
        // status
        danger: "#c95a6e",
        // legacy aliases — keep so unrefactored surfaces still resolve
        paper: "#fdf6f0",
        "paper-2": "#fffaf3",
        "paper-3": "#f5ebdf",
        primary: "#d8889a",
        "primary-focus": "#c66f81",
        persimmon: "#d8889a",
        "persimmon-soft": "#f5cfd5",
        sage: "#6fa388",
        canvas: "#fffaf3",
        parchment: "#fdf6f0",
        pearl: "#fffaf3",
        tile: "#2a2530",
        "tile-2": "#3a3340",
        "tile-3": "#2a2530",
        "body-muted": "#c7bdc8",
        "primary-on-dark": "#f5cfd5",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "var(--font-gowun)",
          "Gowun Dodum",
          "Pretendard Variable",
          "Pretendard",
          "Georgia",
          "serif",
        ],
        // legacy mono token resolves to sans with tabular-nums
        mono: [
          "Pretendard Variable",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        wider: "0.08em",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
      maxWidth: {
        content: "480px",
        prosewide: "640px",
      },
      boxShadow: {
        page: "0 1px 0 rgba(154, 77, 93, 0.04), 0 8px 22px -10px rgba(154, 77, 93, 0.16)",
        soft: "0 1px 0 rgba(154, 77, 93, 0.05), 0 4px 14px -6px rgba(154, 77, 93, 0.18)",
        sticker:
          "0 1px 0 rgba(154, 77, 93, 0.06), 0 6px 18px -8px rgba(154, 77, 93, 0.28)",
        ink: "0 0 0 1px rgba(42, 37, 48, 0.05), 0 2px 8px -4px rgba(42, 37, 48, 0.16)",
        product: "0 8px 24px -10px rgba(42, 37, 48, 0.30)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bouncePop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "rise-in":
          "riseIn 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "bounce-pop":
          "bouncePop 360ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
