/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      colors: {
        accent: "#6366f1",
        "accent-purple": "#8b5cf6",
        "accent-cyan": "#22d3ee",
        "bg-primary": "#080b14",
        "bg-secondary": "#0d1120",
        "bg-card": "#111827",
      },
    },
  },
  plugins: [],
};
