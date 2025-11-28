// tailwind.config.js
const { heroui } = require("@heroui/theme");
const { shadcnAdapter } = require("./lib/theme/adapters/shadcn");
const { heroUIAdapter } = require("./lib/theme/adapters/heroui");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: shadcnAdapter,
  },
  plugins: [
    heroui({
      themes: heroUIAdapter,
    }),
  ],
};