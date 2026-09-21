import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50:  "#fcf2f2",
          100: "#f8e1e1",
          400: "#ef5350", // light accent — trust bar stats, badges
          500: "#e53935",
          600: "#d32f2f",
          700: "#c62828", // hover states
          800: "#8B1313", // dark red — form sidebar bg
          900: "#4a0000", // very dark — deepest containers
        },
      },
    },
  },
  plugins: [],
};
export default config;
