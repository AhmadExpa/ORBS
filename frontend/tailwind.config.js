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
        surface: "#f5f7fb",
        brand: "#0c6cf2",
      },
      boxShadow: {
        panel: "0 18px 50px -24px rgba(15, 23, 42, 0.28)",
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
