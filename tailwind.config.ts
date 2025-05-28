import type { Config } from "tailwindcss"
import { pg_backgrounds, pg_colors, pg_fonts } from "./theme/tokens.mjs"

export default {
  get content() {
    const _content = [
      "./index.html",
      "./src/**/*.{html,vue,svelte,astro,js,cjs,mjs,ts,cts,mts,jsx,tsx,md,mdx}"
      //...
    ]
    return process.env.NODE_ENV === "production" ? _content : [..._content, "./_pginfo/**/*.{html,js}"] // used by Vue Designer
  },
  theme: {
    extend: {}
  },
  plugins: [
    require("@pinegrow/tailwindcss-plugin").default({
      colors: pg_colors, // primary, secondary etc
      fonts: pg_fonts,
      backgrounds: pg_backgrounds // bg-design-image, bg-design-image-large
    })
  ]
} satisfies Config
