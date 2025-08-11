import { defineNuxtConfig } from "nuxt/config"

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxtjs/color-mode",
    "@nuxtjs/seo",
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "nitro-cloudflare-dev",
    "@sentry/nuxt/module"
  ],

  devtools: { enabled: true },

  colorMode: {
    preference: "dark",
    fallback: "dark",
    storageKey: "nuxt-color-mode"
  },

  runtimeConfig: {
    // Server-side environment variables
    apiJwtSecret: process.env.API_JWT_SECRET || "dev-secret-change-in-production",
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || "",
    public: {
      // Client-side environment variables
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "/api"
    }
  },

  compatibilityDate: "2025-07-19",

  future: {
    compatibilityVersion: 4
  },

  experimental: {
    viewTransition: true,
    componentIslands: true,
    lazyHydration: true
  },

  nitro: {
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
    experimental: {
      wasm: true
    },
    rollupConfig: {
      external: [],
      plugins: []
    },
    routeRules: {
      "/api/**": {
        cors: true,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "0" // Updated per best practices
        }
      },
      "/go/**": {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      },
      // Static redirects from original Worker
      "/301": { redirect: { to: "https://www.youtube.com/watch?v=fEM21kmPPik", statusCode: 301 } },
      "/302": { redirect: { to: "https://www.youtube.com/watch?v=BDERfRP2GI0", statusCode: 302 } },
      "/cv": { redirect: { to: "https://cv.dave.io", statusCode: 302 } },
      "/nerd-fonts": { redirect: { to: "https://dave.io/go/nerd-fonts", statusCode: 302 } },
      "/contact": { redirect: { to: "https://dave.io/dave-williams.vcf", statusCode: 302 } },
      "/public-key": { redirect: { to: "https://dave.io/dave-williams.asc", statusCode: 302 } },
      "/todo": { redirect: { to: "https://dave.io/go/todo", statusCode: 302 } },
      // CORS headers for nostr.json
      "/.well-known/nostr.json": {
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      }
    }
  },

  // Vite configuration to disable sourcemaps in production
  vite: {
    build: {
      // sourcemap: true // Enable sourcemaps in production (disable if warnings)
    }
  },

  fonts: {
    defaults: {
      weights: [400],
      styles: ["normal", "italic"],
      subsets: ["latin-ext", "latin"]
    },
    families: [
      { name: "Sixtyfour Convergence", provider: "google" },
      { name: "Sono", provider: "google" },
      { name: "Victor Mono", provider: "google" }
    ],
    assets: {
      prefix: "/_fonts/"
    }
  },

  tailwindcss: {
    cssPath: "~/app/assets/css/tailwind.css",
    configPath: "./tailwind.config.ts",
    editorSupport: true,
    viewer: false,
    exposeConfig: false
  },

  sentry: {
    // autoInjectServerSentry: "experimental_dynamic-import", // breaks build
    autoInjectServerSentry: "top-level-import",
    sourceMapsUploadOptions: {
      org: "daveio",
      project: "dave-io"
    }
  },

  sourcemap: {
    client: "hidden"
  }
})
