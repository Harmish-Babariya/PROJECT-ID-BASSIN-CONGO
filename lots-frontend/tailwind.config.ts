import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f7fa",
        primary: "#2ac1a3",
        text: "#1a1a2e",
      },
      fontFamily: {
        archivo: ["var(--font-archivo-narrow)", "sans-serif"],
        courier: ["var(--font-courier-prime)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
