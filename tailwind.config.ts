import type { Config } from "tailwindcss";

// Apple Web Design System 토큰 매핑 (design-system.md §Colors / §Typography / §Shapes 그대로)
// v0.5 PIVOT — 모든 v0.4 sticker-diary 토큰 폐기, Single accent #0066cc 복원

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === Brand & Accent ===
        primary: "#0066cc", // Action Blue — single brand interactive color (text links, pill CTAs, focus ring root)
        "primary-focus": "#0071e3", // Focus Blue — keyboard focus ring on buttons
        "primary-on-dark": "#2997ff", // Sky Link Blue — inline links on dark surfaces

        // === Surfaces ===
        canvas: "#ffffff", // Pure White — dominant canvas
        "canvas-parchment": "#f5f5f7", // Apple off-white — alternating tiles, footer, default page canvas
        "surface-pearl": "#fafafc", // Near-white for secondary "ghost" buttons
        "surface-tile-1": "#272729", // Primary dark-tile surface
        "surface-tile-2": "#2a2a2c", // Micro-step lighter dark tile
        "surface-tile-3": "#252527", // Micro-step darker dark tile
        "surface-black": "#000000", // True void — video player, edge-to-edge photo overlay, nav bar
        "surface-chip-translucent": "#d2d2d7", // Base hex for translucent gray chips

        // === Text ===
        ink: "#1d1d1f", // Near-Black Ink — headlines, body, dark utility button fill
        body: "#1d1d1f", // Same hex — single near-black for all text on light surfaces
        "body-on-dark": "#ffffff",
        "body-muted": "#cccccc", // Secondary copy on dark tiles
        "ink-muted-80": "#333333", // Body on Pearl Button surface
        "ink-muted-48": "#7a7a7a", // Disabled text + legal fine-print

        // === Hairlines & Borders ===
        "divider-soft": "#f0f0f0", // Border tone on secondary buttons (ring shadow)
        "divider-subtle": "rgba(0, 0, 0, 0.08)", // DESIGN-GAP-1 (L19) — hairline alpha tone
        hairline: "#e0e0e0", // 1px hairline on utility cards, configurator chips

        // === Status ===
        danger: "rgb(220, 38, 38)", // Permanent delete button text only (예외 토큰, L46) — v0.5 OOS UI
      },
      fontFamily: {
        sans: [
          "SF Pro Text",
          "Pretendard Variable",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "SF Pro Text",
          "Pretendard Variable",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        // Apple typography hierarchy (design-system §Typography)
        "nav-link": ["12px", { lineHeight: "1.2", letterSpacing: "-0.12px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "1.4", letterSpacing: "-0.224px", fontWeight: "400" }],
        "caption-strong": ["14px", { lineHeight: "1.4", letterSpacing: "-0.224px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "1.47", letterSpacing: "-0.022em", fontWeight: "400" }],
        "body-strong": ["17px", { lineHeight: "1.47", letterSpacing: "-0.022em", fontWeight: "600" }],
        tagline: ["21px", { lineHeight: "1.19", letterSpacing: "0.011em", fontWeight: "600" }],
        lead: ["28px", { lineHeight: "1.14", letterSpacing: "0.007em", fontWeight: "400" }],
        "display-lg": ["40px", { lineHeight: "1.1", letterSpacing: "0", fontWeight: "600" }],
      },
      spacing: {
        section: "80px",
      },
      maxWidth: {
        content: "980px",
        prosewide: "640px",
      },
      borderRadius: {
        none: "0",
        xs: "4px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        xl: "20px",
        pill: "9999px",
      },
      boxShadow: {
        // Only used on product/photo renders (design-system §Elevation)
        product: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0",
        // Soft hairline ring for secondary buttons
        "ring-soft": "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleDown: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.95)" },
        },
      },
      animation: {
        // 150~300ms 범위 (constraint §디자인 토큰)
        "fade-up": "fade-up 200ms cubic-bezier(0.22, 0.61, 0.36, 1) both",
        // The system-wide micro-interaction (Apple — press = scale(0.95))
        "press-down": "scaleDown 100ms ease-out forwards",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
