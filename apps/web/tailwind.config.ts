import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: "#e8fbff",
          200: "#b8ecf5",
          500: "#0aa8cc",
          700: "#0b6e85",
          900: "#062a34"
        }
      }
    }
  },
  plugins: []
};

export default config;
