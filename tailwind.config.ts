import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
        "primary-focus": "#0071e3",
        "primary-on-dark": "#2997ff",
        canvas: "#ffffff",
        parchment: "#f5f5f7",
        pearl: "#fafafc",
        tile: "#272729",
        "tile-2": "#2a2a2c",
        "tile-3": "#252527",
        ink: "#1d1d1f",
        "body-muted": "#cccccc",
        "ink-muted": "#7a7a7a",
        hairline: "#e0e0e0",
        danger: "rgb(220,38,38)",
      },
      boxShadow: {
        product: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0",
      },
      borderRadius: {
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
      },
      maxWidth: {
        content: "1440px",
        prosewide: "980px",
      },
    },
  },
  plugins: [],
};

export default config;
