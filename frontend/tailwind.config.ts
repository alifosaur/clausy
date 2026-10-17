import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens: paper background
        paper: {
          DEFAULT: "#FAF8F5",
          50: "#FFFFFF",
          100: "#FAF8F5",
          200: "#F4F0E8",
          300: "#EAE4D7",
          border: "#E2DCD0",
          "border-dark": "#C8BFB0",
        },
        // Design tokens: ink text
        ink: {
          DEFAULT: "#141413",
          deep: "#0D0D0C",
          muted: "#524F49",
          light: "#66625B",
        },
        // Design tokens: highlighter-yellow accent
        highlighter: {
          DEFAULT: "#FFE600",
          soft: "rgba(254, 240, 138, 0.65)",
          solid: "#FEF08A",
          accent: "#FACC15",
          glow: "rgba(250, 204, 21, 0.35)",
        },
        // Design tokens: muted greys (paper-tinted)
        grey: {
          50: "#FAF9F7",
          100: "#F4F2ED",
          200: "#EAE6DE",
          300: "#DDD8CD",
          400: "#A6A093",
          500: "#757065",
          600: "#545048",
          700: "#383630",
          800: "#22211E",
          900: "#141413",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "0.25rem", // 4px
        DEFAULT: "0.375rem", // 6px
        md: "0.5rem", // 8px
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        "2xl": "1.25rem", // 20px
        "3xl": "1.5rem", // 24px
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
      boxShadow: {
        paper: "0 1px 3px rgba(20, 20, 19, 0.05), 0 10px 25px -5px rgba(20, 20, 19, 0.04)",
        "paper-lg": "0 10px 30px -5px rgba(20, 20, 19, 0.08), 0 20px 40px -15px rgba(20, 20, 19, 0.05)",
        marker: "0 0 0 2px #FFE600",
      },
    },
  },
  plugins: [],
};
export default config;
