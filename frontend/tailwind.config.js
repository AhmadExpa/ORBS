/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        // Warm minimal canvas + panel surfaces (Stripe-style crisp)
        canvas: "#faf9f7",
        surface: "#f5f4f1",
        panel: "#ffffff",
        line: "#eceae6",
        ink: "#1a1a1a",
        muted: "#6b7280",
        // ElevenOrbits brand
        brand: {
          DEFAULT: "#0c6cf2",
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          500: "#2f86f6",
          600: "#0c6cf2",
          700: "#0a57c2",
        },
        accent: {
          DEFAULT: "#ff7a1a",
          50: "#fff3e9",
          100: "#ffe2cc",
          200: "#ffd0a8",
          300: "#ffb877",
          400: "#ff9d45",
          500: "#ff8a26",
          600: "#ff7a1a",
          700: "#e7650a",
        },
      },
      boxShadow: {
        // Legacy stacked shadow (kept for marketing/back-compat)
        panel: "0 18px 50px -24px rgba(15, 23, 42, 0.28)",
        // Minimal, crisp elevation — mostly carried by hairline borders
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
        "card-hover": "0 1px 3px rgba(16, 24, 40, 0.06), 0 4px 12px -6px rgba(16, 24, 40, 0.1)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(14,165,233,0.15), transparent 35%), radial-gradient(circle at bottom right, rgba(37,99,235,0.12), transparent 28%)",
      },
    },
  },
  plugins: [],
};

export default config;
