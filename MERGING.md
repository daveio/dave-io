# Merging the Password Generator into Another Nuxt App

This guide explains how to bring the MU/TH/UR 6000 passphrase generator into an existing Nuxt application. It covers both the functional core (which is portable) and the Nostromo visual theme (which is optional and separable).

---

## Architecture Overview

The generator is cleanly layered. Understanding this helps you decide what to take and what to leave behind.

```
┌──────────────────────────────────────────────────────┐
│  Page (index.vue)           ← layout & assembly      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Components                                     │  │
│  │  PasswordDisplay  PasswordControls  StrengthMeter│ │
│  │  HeaderBar  WarningLabel                        │  │
│  └──────────────┬─────────────────────────────────┘  │
│                 │ uses                                │
│  ┌──────────────▼─────────────────────────────────┐  │
│  │  Composable (usePasswordGenerator)              │  │
│  │  State + generation logic + clipboard + zxcvbn  │  │
│  └──────────────┬─────────────────────────────────┘  │
│                 │ imports                             │
│  ┌──────────────▼──────────┐  ┌────────────────────┐│
│  │  Utils (word-corpus.ts) │  │ Plugin (zxcvbn)    ││
│  │  345 sci-fi words       │  │ Dictionary loader  ││
│  └─────────────────────────┘  └────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Functional core** (always needed): composable + word corpus + zxcvbn plugin
**Presentation layer** (adapt to your app): components + page + CSS theme

---

## Step 1: Install Dependencies

```bash
# zxcvbn for password strength estimation (~1.8MB dictionaries, code-split at runtime)
bun add @zxcvbn-ts/core @zxcvbn-ts/language-common @zxcvbn-ts/language-en
```

These are the only required additions. If your app already uses Tailwind + DaisyUI, skip those. If not:

```bash
# Only if you don't already have Tailwind v4 + DaisyUI 5
bun add tailwindcss @tailwindcss/vite daisyui
```

### Tailwind v4 caveat

This project uses **Tailwind CSS v4** with the Vite plugin directly — _not_ `@nuxtjs/tailwindcss`, which installs Tailwind v3. If your target app uses `@nuxtjs/tailwindcss`, you have two options:

1. **Keep v3**: The DaisyUI theme syntax (`@plugin "daisyui/theme" {}`) won't work. You'll need to configure the theme via `tailwind.config.ts` instead (DaisyUI 4 style).
2. **Switch to v4**: Remove `@nuxtjs/tailwindcss` and add the Vite plugin in `nuxt.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite'
   export default defineNuxtConfig({
     vite: { plugins: [tailwindcss()] },
   })
   ```

---

## Step 2: Copy the Functional Core

These three files are the heart of the generator. They have no visual dependencies.

### `app/plugins/zxcvbn.client.ts`

Copy as-is. The `.client.ts` suffix ensures it only runs in the browser (dictionaries aren't needed during SSR). It configures the global `zxcvbnOptions` singleton with English dictionaries and keyboard adjacency graphs.

**What it does**: Loads ~1.8MB of password dictionaries so zxcvbn can estimate crack times. The composable dynamically imports `zxcvbnAsync` to keep this off the critical path.

**Adapt if**: You need non-English dictionaries — swap `@zxcvbn-ts/language-en` for your target language package.

### `app/utils/word-corpus.ts`

Copy as-is, or replace with your own word list. The only contract is:

```ts
export const SCIFI_WORDS: string[]  // or whatever you name it
```

- Must be an array of lowercase strings
- No duplicates (the file includes a dev-mode check)
- Minimum ~50 words recommended for decent passphrase variety at higher word counts

**If you change the export name**, update the single import in `usePasswordGenerator.ts`.

### `app/composables/usePasswordGenerator.ts`

Copy as-is. This is the core logic:

- `wordCount`, `capitalize`, `appendSuffix` — reactive state (configurable defaults)
- `password` — the generated passphrase string
- `strength` — zxcvbn result object (or null while loading)
- `generate()` — Fisher-Yates shuffle + slice from corpus
- `copyToClipboard()` — clipboard API with 2-second "copied" feedback
- Uses `crypto.getRandomValues()` for cryptographically secure randomness
- Uses `onMounted()` for initial generation (not `watch({ immediate: true })`) to avoid SSR hydration mismatch

**Design decisions baked in**:

| Decision | Current choice | How to change |
|----------|---------------|---------------|
| Separator | `-` (hyphen) | Change `const separator = '-'` on line 19 |
| Suffix length | 3 digits (000-999) | Change `secureRandom(1000)` and `.padStart(3, '0')` |
| Default word count | 4 | Change `ref(4)` on line 12 |
| Defaults on/off | Capitalize: on, Suffix: on | Change `ref(true)` on lines 13-14 |
| No duplicate words | Shuffle-and-slice | Inherent to Fisher-Yates approach |

---

## Step 3: Copy Components (Adapt to Your Design)

The components use DaisyUI classes and the Nostromo theme. You can use them as-is if you want the Alien aesthetic, or strip the visual styling while keeping the structure.

### Minimal integration (no theme)

If you just want the generator in your existing UI, you don't need any of the components. Use the composable directly in any page or component:

```vue
<script setup lang="ts">
const {
  wordCount, capitalize, appendSuffix,
  password, strength, copied,
  generate, copyToClipboard,
} = usePasswordGenerator()
</script>

<template>
  <div>
    <p>{{ password }}</p>
    <button @click="copyToClipboard">{{ copied ? 'Copied!' : 'Copy' }}</button>
    <button @click="generate">Regenerate</button>
    <input v-model.number="wordCount" type="range" min="1" max="10">
    <label><input v-model="capitalize" type="checkbox"> Capitalize</label>
    <label><input v-model="appendSuffix" type="checkbox"> 3-digit suffix</label>
    <p v-if="strength">Strength: {{ strength.score }}/4</p>
  </div>
</template>
```

That's the entire functional surface. Everything else is presentation.

### Full component integration

Copy these files, adapting styles to your design system:

| File | Purpose | Theme-coupled? |
|------|---------|---------------|
| `PasswordDisplay.vue` | Shows password + copy/regenerate buttons | Light — just DaisyUI `btn` classes |
| `PasswordControls.vue` | Range slider + toggle switches | Light — DaisyUI `range`, `toggle` |
| `StrengthMeter.vue` | 5-segment bar + crack time display | Moderate — color mapping, glow effects |
| `WarningLabel.vue` | Reusable warning/notice/danger banner | Light — easy to restyle |
| `HeaderBar.vue` | Nostromo branding, status indicators | **Heavy** — purely thematic, skip unless you want it |

### Component dependencies

```
index.vue
├── HeaderBar           (standalone, no props)
├── PasswordDisplay     (props: password, copied; emits: copy, regenerate)
├── PasswordControls    (v-model: wordCount, capitalize, appendSuffix)
├── StrengthMeter       (props: strength)
└── WarningLabel        (props: type, text)  ← also used inside Controls & Meter
```

`WarningLabel` is used by `PasswordControls` and `StrengthMeter` internally. If you skip `WarningLabel`, remove the `<WarningLabel>` tags from those components.

---

## Step 4: Theme (Optional)

### Using the Nostromo theme

Copy the theme block from `app/assets/css/main.css` into your own CSS file:

```css
@plugin "daisyui/theme" {
  name: "nostromo";
  default: true;       /* remove if you don't want it as the default */
  prefersdark: true;
  color-scheme: dark;
  /* ... all the oklch color definitions ... */
}
```

Then apply it to a container:

```html
<div data-theme="nostromo">
  <!-- password generator content -->
</div>
```

This scopes the theme to just the generator section without affecting the rest of your app.

### Visual effects

The CSS effects in `main.css` are standalone classes you can cherry-pick:

| Class | Effect | Used by |
|-------|--------|---------|
| `.glow-amber` | CRT amber text-shadow | PasswordDisplay, PasswordControls, HeaderBar |
| `.glow-green` | Green terminal text-shadow | StrengthMeter (STRONG/MAXIMUM scores) |
| `.glow-red` | Red alarm text-shadow | StrengthMeter (CRITICAL score) |
| `.scanlines` | Full-page scanline overlay (::after) | app.vue root element |
| `.hazard-stripe` | Diagonal warning stripes background | HeaderBar, footer |
| `.crt-flicker` | Subtle opacity animation | HeaderBar title |
| `.password-text` | word-break + letter-spacing | PasswordDisplay |

### Typography

The project uses JetBrains Mono via `@nuxt/fonts` (auto-fetched, no manual install). If your app already has a font stack, remove the `body { font-family: ... }` rule.

---

## Step 5: Nuxt Module Dependencies

The project uses several `@nuxt/*` modules. Here's which ones matter for the generator:

| Module | Required? | Why |
|--------|-----------|-----|
| `@nuxt/fonts` | No (nice-to-have) | Auto-fetches JetBrains Mono. Remove if you have your own fonts. |
| `@nuxt/icon` | Only if using components as-is | `<Icon name="lucide:..." />` in PasswordDisplay. Replace with your own icon solution or plain text if you skip this. |
| `@nuxt/eslint` | No | Development tooling only |
| `@nuxt/a11y` | No (recommended) | Accessibility auditing in dev |
| `@nuxt/hints` | No | Performance hints in dev |
| `@nuxt/image` | No | Not used by the generator |
| `@nuxt/scripts` | No | Not used by the generator |

If you skip `@nuxt/icon`, replace the icon references in `PasswordDisplay.vue`:

```vue
<!-- Instead of: -->
<Icon name="lucide:clipboard-copy" size="14" />

<!-- Use plain text, an SVG, or your app's icon system -->
```

---

## SSR Considerations

Two SSR-sensitive patterns to be aware of:

1. **zxcvbn plugin is client-only** (`.client.ts` suffix). This is correct — the dictionaries are large and only needed in the browser. Don't change this to a universal plugin.

2. **Initial password generation happens in `onMounted()`**, not in a `watch({ immediate: true })`. This is intentional: `crypto.getRandomValues()` produces different values on server vs client, which causes a hydration mismatch. The `onMounted()` hook only runs client-side, avoiding the issue. The password field will be empty during SSR and fill in on mount.

   If you need a placeholder during SSR, you could add a static string:
   ```ts
   const password = ref('Generating...')
   ```

---

## Quick Checklist

```
[ ] Install @zxcvbn-ts/core, language-common, language-en
[ ] Copy app/plugins/zxcvbn.client.ts
[ ] Copy app/utils/word-corpus.ts (or bring your own word list)
[ ] Copy app/composables/usePasswordGenerator.ts
[ ] Copy components you want (or use the composable directly)
[ ] If using Nostromo theme: copy theme block from main.css
[ ] If using icons: ensure @nuxt/icon is installed, or replace <Icon> tags
[ ] Test: password generates on mount, options auto-regenerate, copy works
```

---

## File Manifest

For reference, here's every file in the generator with its role:

```
app/
├── app.vue                              # Root: data-theme="nostromo" + scanlines
├── assets/css/main.css                  # Tailwind + DaisyUI + theme + effects
├── components/
│   ├── HeaderBar.vue                    # Nostromo branding (theme-only, skip if unwanted)
│   ├── PasswordControls.vue             # Word count slider + toggles
│   ├── PasswordDisplay.vue              # Password text + copy/regenerate buttons
│   ├── StrengthMeter.vue                # zxcvbn score bar + crack times
│   └── WarningLabel.vue                 # Reusable warning/notice/danger label
├── composables/
│   └── usePasswordGenerator.ts          # Core: generation, state, zxcvbn, clipboard
├── pages/
│   └── index.vue                        # Page assembly (layout reference only)
├── plugins/
│   └── zxcvbn.client.ts                 # Client-only zxcvbn dictionary loader
└── utils/
    └── word-corpus.ts                   # 345 sci-fi words (no external dependencies)
```
