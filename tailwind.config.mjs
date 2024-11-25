/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      keyframes: {
        "pixel-bounce": {
          "0%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(2)" },
        },
      },
      animation: {
        "pixel-bounce": "pixel-bounce 0.5s infinite alternate",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
