import { URL, fileURLToPath } from "node:url"

import { liveDesigner } from "@pinegrow/vite-plugin"
import presetIcons from "@unocss/preset-icons"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"
import AutoImportAPIs from "unplugin-auto-import/vite"
import AutoImportComponents from "unplugin-vue-components/vite"
import { defineConfig } from "vite"
import vueDevTools from "vite-plugin-vue-devtools"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    liveDesigner({
      tailwindcss: {
        configPath: "tailwind.config.ts",
        cssPath: "@/assets/main.css",
        restartOnConfigUpdate: true,
        restartOnThemeUpdate: true
      }
    }),
    Unocss({
      presets: [
        presetIcons({
          prefix: "i-" // default prefix, do not change
        })
      ],
      content: {
        pipeline: {
          /* Please ensure that you update the filenames and paths to accurately match those used in your project. */
          include: ["./frontend/**/*"]
        }
      }
    }),
    // https://github.com/antfu/unplugin-vue-components#configuration
    AutoImportComponents({
      /* Please ensure that you update the filenames and paths to accurately match those used in your project. */

      dirs: ["./frontend/components"],

      // allow auto load markdown components under ./src/components/
      extensions: ["vue", "md"],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      // resolvers: [], // Auto-import using resolvers
      dts: "components.d.ts"
    }),
    // https://github.com/antfu/unplugin-auto-import#configuration
    vue(),
    AutoImportAPIs({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/ // .md
        // /\.mdx$/, // .mdx
      ],
      imports: [
        "vue",
        "vue-router"
        // 'vue-i18n',
        // 'vue/macros',
        // '@vueuse/head',
        // '@vueuse/core',
        // 'pinia',
      ],
      dirs: [
        /* Please ensure that you update the filenames and paths to accurately match those used in your project. */
        "**/pg-*/**" // To auto-import composables from Vue Designer plugins.
        // 'src/composables',
        // 'src/utils',
        // 'src/stores',
      ],
      vueTemplate: true,
      dts: "auto-imports.d.ts"
    }),
    vueDevTools()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./frontend", import.meta.url)),
      "~": fileURLToPath(new URL("./frontend", import.meta.url)),
      "~~": fileURLToPath(new URL("./", import.meta.url))
    }
  }
})
