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
        paper: {
          DEFAULT: "#FAF8F5",
          50: "#FFFFFF",
          100: "#FAF8F5",
          200: "#F4F0E8",
          300: "#EAE4D7",
          border: "#E2DCD0",
          "border-dark": "#C8BFB0",
        },
        ink: {
          DEFAULT: "#141413",
          light: "#78746C",
          muted: "#524F49",
          deep: "#0D0D0C",
        },
        highlighter: {
          DEFAULT: "#FFE600",
          soft: "rgba(254, 240, 138, 0.65)",
          solid: "#FEF08A",
          accent: "#FACC15",
          glow: "rgba(250, 204, 21, 0.3)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(20, 20, 19, 0.05), 0 10px 25px -5px rgba(20, 20, 19, 0.04)",
        "paper-lg": "0 10px 30px -5px rgba(20, 20, 19, 0.08), 0 20px 40px -15px rgba(20, 20, 19, 0.05)",
        highlight: "0 0 0 2px #FFE600",
      },
    },
  },
  plugins: [],
};
export default config;
