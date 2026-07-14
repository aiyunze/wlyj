import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFF8F0",
        sepia: "#8B6914",
        bark: "#5C3D2E",
        gold: "#C9A96E",
        ink: "#2C1810",
        cream: "#F5E6D3",
        rust: "#A0522D",
        moss: "#6B8E4E",
        blush: "#E8D5C4",
      },
      fontFamily: {
        letter: ["Georgia", "Times New Roman", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture":
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,105,20,0.03) 2px, rgba(139,105,20,0.03) 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
