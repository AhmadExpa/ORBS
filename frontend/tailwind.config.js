/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral canvas + panel surfaces (flat enterprise look)
        canvas: "#f7f8fa",
        surface: "#f5f7fb",
        panel: "#ffffff",
        line: "#e6e8ec",
        ink: "#0f172a",
        muted: "#64748b",
        // ElevenOrbits brand
        brand: {
          DEFAULT: "#0c6cf2",
          50: "#eef5ff",
          100: "#d9e8ff",
          600: "#0c6cf2",
          700: "#0a57c2",
        },
        accent: {
          DEFAULT: "#ff7a1a",
          50: "#fff3e9",
          100: "#ffe2cc",
          600: "#ff7a1a",
          700: "#e7650a",
        },
      },
      boxShadow: {
        // Legacy stacked shadow (kept for marketing/back-compat)
        panel: "0 18px 50px -24px rgba(15, 23, 42, 0.28)",
        // Flat, restrained card elevation
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 6px 16px -10px rgba(15, 23, 42, 0.12)",
        "card-hover": "0 2px 4px rgba(15, 23, 42, 0.05), 0 12px 28px -14px rgba(15, 23, 42, 0.16)",
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
