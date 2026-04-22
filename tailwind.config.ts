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
        chalk: {
          white: "#F5F0E8",
          yellow: "#FFE066",
          green: "#7FD97F",
          blue: "#6BBFFF",
          red: "#FF7F7F",
          orange: "#FFB347",
          pink: "#FF9ECD",
          cyan: "#7FFFEF",
        },
      },
      fontFamily: {
        chalk: ["'Caveat'", "cursive"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
