/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Stanford Climate Week palette
        cardinal: "#8C1515",
        forest: {
          DEFAULT: "#0B3D2E",
          light: "#14664A",
          tint: "#E6F0EB",
        },
        sky: "#2E86AB",
        sand: "#F4F1EA",
        ink: "#1A1A1A",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
