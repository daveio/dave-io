import type { Config } from "tailwindcss"

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Victor Mono", "monospace"],
        subtitle: ["Sono", "sans-serif"],
        display: ["Sixtyfour Convergence", "sans-serif"]
      },
      backgroundImage: {
        "rainbow-gradient":
          "linear-gradient(to right, #e87777 35%, #eaaa77 40%, #eacc77 45%, #eded77 50%, #aaeaaa 55%, #77ccea 60%, #ccaaea 65%, #eaaad4 70%)"
      }
    }
  },
  plugins: [
    require("daisyui")
  ],
  // @ts-ignore - DaisyUI config not yet typed for Tailwind 4
  daisyui: {
    themes: [
      "light",
      "dark", 
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset"
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    logs: false
  }
} satisfies Config