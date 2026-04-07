import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        mist: "#FFF7F4",
        blush: "#F7E2ED",
        lilac: "#ECE4FF",
        violet: "#B287F4",
        rose: "#E88BB5",
        beige: "#F7EBDD",
        cream: "#FFFDF9",
        ink: "#342E42"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(94, 72, 124, 0.10)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        doodle: ["Chalkboard SE", "Comic Sans MS", "Marker Felt", "cursive"]
      }
    }
  },
  plugins: []
};

export default config;
