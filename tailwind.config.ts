import type { Config } from "tailwindcss"

export default (<Partial<Config>>{
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
    require("@catppuccin/tailwindcss")({
      defaultFlavour: "mocha"
    })
  ]
})
