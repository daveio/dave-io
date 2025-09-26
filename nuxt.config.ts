// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite"

declare global {
  interface Window {
    SentryToolbar?: {
      init(config: { organizationSlug: string; projectIdOrSlug: string }): void
    }
  }
}

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/vnd.microsoft.icon", href: "/images/icon.ico" },
        { rel: "me", href: "https://basilisk.gallery/@dave" },
      ],
    },
  },
  colorMode: {
    preference: "dark",
    fallback: "dark",
    storageKey: "nuxt-color-mode",
  },
  compatibilityDate: "2025-08-13",
  css: ["~/assets/css/main.css"],
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  eslint: {
    checker: true,
  },
  experimental: {
    componentIslands: true,
    inlineRouteRules: true,
    lazyHydration: true,
    viewTransition: true,
  },
  fonts: {
    assets: {
      prefix: "/_fonts/",
    },
    families: [
      { name: "Sixtyfour Convergence", provider: "bunny" },
      { name: "Sono", provider: "bunny" },
      { name: "Victor Mono", provider: "bunny" },
    ],
    defaults: {
      styles: ["normal", "italic"],
      subsets: ["latin-ext", "latin"],
      weights: [400],
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  modules: [
    // "@nuxt/content", // disabled for later
    "@formkit/auto-animate/nuxt",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxtjs/color-mode",
    "@nuxtjs/device",
    "@nuxtjs/seo",
    "@nuxtjs/turnstile",
    "@pinia/nuxt",
    "@sentry/nuxt/module",
    "magic-regexp/nuxt",
    "nitro-cloudflare-dev",
    "nuxt-security",
    "nuxt-gtag",
  ],
  nitro: {
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    experimental: {
      wasm: true,
    },
    preset: "cloudflare_module",
    routeRules: {
      "/api/**": {
        cors: true,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "0",
        },
      },
      "/go/**": {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
      "/.well-known/nostr.json": {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    },
  },
  robots: {
    mergeWithRobotsTxtPath: "app/assets/robots.txt",
  },
  runtimeConfig: {
    anthropicApiKey: "", // overridden by environment variable
    ctrldApiKey: "", // overridden by environment variable
    ctrldAuthKey: "", // overridden by environment variable
    linearApiKey: "", // overridden by environment variable
    openRouterApiKey: "", // overridden by environment variable
    public: {
      apiBase: "/api",
      cloudflare: {
        accountId: "def50674a738cee409235f71819973cf",
      },
      siteUrl: "https://dave.io",
      turnstile: {
        siteKey: "0x4AAAAAABraTjA80I4Pmf1K",
      },
    },
    turnstileSecretKey: "", // overridden by environment variable
  },
  security: {
    ssg: {
      hashScripts: true,
      hashStyles: true,
      meta: true,
    },
    sri: true,
  },
  sentry: {
    autoInjectServerSentry: "top-level-import",
    sourceMapsUploadOptions: {
      org: "daveio",
      project: "dave-io",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  },
  site: {
    name: "dave.io",
    url: "https://dave.io",
    indexable: true,
  },
  sourcemap: {
    client: "hidden",
    server: true,
  },
  turnstile: {
    siteKey: "0x4AAAAAABraTjA80I4Pmf1K",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: "esbuild",
    },
  },
})
