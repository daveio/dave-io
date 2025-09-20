# Learning Guide: @nuxt/content with Nuxt 4 on Cloudflare Workers

## Understanding the Architecture

Before we dive into code, let's understand what we're building and why each piece matters.

### Why Cloudflare Workers for a Blog?

Cloudflare Workers runs your code at the edge - meaning it executes in data centres close to your users. Unlike traditional hosting where your server might be in London, Workers runs everywhere simultaneously. For a blog, this means:

- **Instant global performance**: Your blog loads quickly whether accessed from Tokyo or Toronto
- **No cold starts**: Unlike serverless functions, Workers stay warm
- **Built-in caching**: Content automatically caches at edge locations
- **Cost efficiency**: You pay per request, not for idle servers

However, Workers has constraints:

- **128MB memory limit**: Forces efficient code design
- **No filesystem access**: Content must be bundled or fetched
- **30-second CPU time**: More than enough for a blog, but shapes our architecture

### How @nuxt/content Works

@nuxt/content transforms your Markdown files into a queryable database at build time. Think of it as:

1. **Build phase**: Markdown → JSON database
2. **Runtime phase**: Query this database like you would MongoDB

The clever bit is that this "database" is actually just JSON files bundled with your application. When you write:

```javascript
queryContent("/blog").find()
```

You're not hitting an actual database - you're querying pre-processed JSON that ships with your app.

## Setting Up the Foundation

### Understanding the Configuration

Let's build our `nuxt.config.ts` step by step, understanding each decision:

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2024-09-19",

  nitro: {
    preset: "cloudflare_module"
    // ... more config
  }
})
```

**Why this matters**: Nitro is Nuxt's server engine. The `cloudflare_module` preset tells Nitro to output code in the format Workers expects - ES modules rather than CommonJS. This is crucial because Workers doesn't understand `require()` statements.

Now let's add the routing rules:

```typescript
nitro: {
  preset: "cloudflare_module",
  routeRules: {
    '/blog/**': {
      headers: {
        'cache-control': 'public, max-age=86400, stale-while-revalidate=604800'
      }
    }
  }
}
```

**What's happening here**: We're telling Cloudflare's edge cache to:

- Keep blog pages cached for 24 hours (`max-age=86400`)
- Serve stale content while fetching updates for up to 7 days (`stale-while-revalidate=604800`)

This means most visitors hit the cache, not your Worker, drastically reducing costs and improving performance.

### Configuring @nuxt/content

The content configuration needs careful thought:

```typescript
content: {
  sources: {
    blog: {
      driver: 'fs',
      prefix: '/blog',
      base: 'content/blog'
    }
  }
}
```

**Understanding sources**: This creates a content source that:

- Reads from `content/blog` directory (`base`)
- Makes it queryable at `/blog` path (`prefix`)
- Uses filesystem driver during build (`driver: 'fs'`)

The key insight: content is read at BUILD time, not runtime. This is why Workers can serve it despite having no filesystem.

### Why We Configure Markdown Processing

```typescript
markdown: {
  remarkPlugins: ['remark-gfm'],
  rehypePlugins: [
    ['rehype-highlight', { subset: false }],
    'rehype-slug',
    'rehype-autolink-headings'
  ]
}
```

Each plugin serves a purpose:

- **remark-gfm**: Adds GitHub-flavoured markdown (tables, strikethrough, etc.)
- **rehype-highlight**: Syntax highlighting for code blocks
- **rehype-slug**: Generates IDs for headings (needed for table of contents)
- **rehype-autolink-headings**: Makes headings clickable anchors

These transform your markdown during build, not runtime, keeping your Worker lean.

## Understanding Content Structure

### Why Directory Structure Matters

```plaintext
content/
└── blog/
    ├── 2024/
    │   └── my-first-post.md
    └── authors/
        └── john-doe.json
```

This structure isn't arbitrary. The paths become your query structure:

```javascript
// This queries content/blog/2024/my-first-post.md
queryContent("/blog/2024/my-first-post").findOne()

// This queries everything in content/blog/
queryContent("/blog").find()

// This queries content/blog/authors/
queryContent("/blog/authors").find()
```

The filesystem structure IS your database schema. Plan it carefully.

### Frontmatter as Your Data Model

```markdown
---
title: "My Post"
date: 2024-09-20
draft: false
tags: ["nuxt", "cloudflare"]
---
```

Frontmatter becomes queryable fields:

```javascript
// Find non-draft posts
queryContent("/blog")
  .where({ draft: { $ne: true } })
  .find()

// Find posts with specific tag
queryContent("/blog")
  .where({ tags: { $contains: "nuxt" } })
  .find()
```

**Key insight**: Design your frontmatter like you would database columns. Every field is queryable, sortable, and filterable.

## Building the Blog Listing Page

Let's understand how to build an efficient blog listing:

```vue
<script setup lang="ts">
const { data: posts } = await useAsyncData(
  "blog-posts",
  () =>
    queryContent("/blog")
      .where({ draft: { $ne: true } })
      .sort({ date: -1 })
      .find(),
  {
    getCachedData(key) {
      const nuxtData = useNuxtData(key)
      if (!nuxtData.value) return null
      return nuxtData.value
    }
  }
)
</script>
```

**What's happening here**:

1. **`useAsyncData` wrapper**: This isn't just about fetching data. It enables:
   - Server-side rendering (data fetched during SSR)
   - Client-side hydration (reuses server data)
   - Navigation caching (reuses data between routes)

2. **`getCachedData` function**: This prevents refetching when navigating back to the listing. Without it, every navigation would requery content.

3. **Query structure**:
   - `.where()` filters out drafts
   - `.sort()` orders by date (newest first)
   - `.find()` returns array of all matches

### Understanding Pagination Strategy

```vue
<script setup>
const page = ref(1)
const postsPerPage = 10
const paginatedPosts = computed(() => {
  const start = (page.value - 1) * postsPerPage
  return posts.value?.slice(start, start + postsPerPage) || []
})
</script>
```

**Why client-side pagination?** On Workers, we want to minimize compute time. By fetching all posts once and paginating client-side:

- Single data fetch (efficient)
- Instant page changes (no server round-trip)
- Works with edge caching (entire dataset cached)

For hundreds of posts, you'd want server-side pagination. For typical blogs (<100 posts), this approach is optimal.

## Creating Individual Post Pages

### The [...slug] Route Pattern

The file `pages/blog/[...slug].vue` uses spread routing:

- `/blog/2024/my-post` → `slug = ['2024', 'my-post']`
- `/blog/my-post` → `slug = ['my-post']`

This flexibility allows nested categorization without multiple page files.

### Error Handling Strategy

```javascript
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" })
}
```

**Why throw, not return?** Throwing an error:

- Triggers Nuxt's error page
- Sets proper HTTP status (important for SEO)
- Allows error tracking in Workers Analytics

### Building Table of Contents

```vue
<script setup>
const toc = computed(() => post.value?.body?.toc || [])
</script>
```

The `toc` (table of contents) is auto-generated from your headings by the `rehype-slug` plugin we configured. Each heading gets:

- An `id` (for anchor links)
- A `depth` (h2=2, h3=3, etc.)
- The `text` content

This happens at build time, so no runtime processing needed.

## Optimizing for Cloudflare Workers

### Understanding KV Storage for Caching

Cloudflare KV is a key-value store at the edge. Think of it as Redis, but distributed globally:

```typescript
// Store in KV
await CONTENT_CACHE.put("blog:my-post", JSON.stringify(content), {
  expirationTtl: 86400 // 24 hours
})

// Retrieve from KV
const cached = await CONTENT_CACHE.get("blog:my-post", "json")
```

**Why use KV for content?** While content is bundled with your app, KV can:

- Cache processed content (with markdown already rendered)
- Store view counts, likes, or dynamic data
- Reduce bundle size for very large blogs

### Image Optimization Strategy

```vue
<img :src="`/cdn-cgi/image/width=${width},quality=85,format=webp${src}`" />
```

This URL pattern triggers Cloudflare's Image Resizing:

- `/cdn-cgi/image/` is a special path Cloudflare intercepts
- `width=800` resizes on-the-fly
- `format=webp` converts to efficient formats
- Images are cached at edge after first transformation

**Key learning**: You upload one image, Cloudflare creates variants on-demand. No build-time image processing needed.

## Deployment Understanding

### Why Wrangler Configuration Matters

```toml
# wrangler.toml
[assets]
directory = "./.output/public"
binding = "ASSETS"
```

This tells Workers about static files:

- `directory`: Where Nuxt outputs static assets
- `binding`: Makes assets accessible in your Worker code

Workers doesn't serve files from disk - it serves from this binding, which is like a CDN built into your Worker.

### Build Process Explained

When you run `npm run build`:

1. **Content processing**: Markdown → JSON
2. **Vue compilation**: Templates → JavaScript
3. **Nitro bundling**: Everything → Worker-compatible module
4. **Asset processing**: Images, styles → static files

The output in `.output/` is:

- `server/`: Your Worker code
- `public/`: Static assets

Both deploy together but serve differently - code executes, assets are fetched.

## Common Pitfalls and Solutions

### The @nuxt/content Compatibility Issue

Currently, @nuxt/content may crash during development when files change. This happens because it's watching for changes but not handling Nuxt 4's new module system correctly.

**Workaround understanding**:

```typescript
content: {
  watch: {
    enabled: process.env.NODE_ENV === "production" ? false : true
  }
}
```

This disables watching in production (where files don't change) but keeps it in development (accepting occasional restarts).

### Memory Considerations

Workers has 128MB RAM. Your blog likely uses <10MB, but understanding memory helps:

- Content is part of your bundle (uses memory)
- Each request gets fresh memory (no leaks between requests)
- Streaming large responses prevents memory spikes

If you have hundreds of posts, consider:

- Splitting content into chunks
- Using KV for storage instead of bundling
- Implementing progressive loading

## Performance Patterns

### Edge Caching Strategy

```typescript
routeRules: {
  '/blog/**': {
    headers: {
      'cache-control': 'public, max-age=86400'
    }
  }
}
```

This creates a caching cascade:

1. **Browser cache**: Visitor's browser caches for 24 hours
2. **Cloudflare edge**: Global CDN caches for 24 hours
3. **Worker execution**: Only runs for cache misses

Most requests never reach your Worker code - they're served from edge cache.

### Lazy Loading Implementation

```vue
<NuxtImg loading="lazy" :modifiers="{ quality: 85, format: 'webp' }" />
```

`loading="lazy"` tells browsers to:

- Only load images when nearly visible
- Prioritize above-the-fold content
- Reduce initial page weight

Combined with Cloudflare's image optimization, users download only what they see, in the optimal format for their device.

## Making It Your Own

Now you understand the 'why' behind each piece. To customize:

1. **Content structure**: Design your `content/` directory like a database schema
2. **Frontmatter**: Add fields for your specific needs (author, category, series)
3. **Query patterns**: Use content queries like database queries
4. **Caching strategy**: Adjust cache times based on update frequency
5. **Image strategy**: Balance quality vs. performance for your audience

The beauty of this setup is that complexity happens at build time. Your Worker just serves pre-processed content efficiently from the edge. Understanding these concepts lets you build not just a blog, but any content-driven site on Cloudflare's infrastructure.

Remember: Workers enforces efficiency through constraints. Embrace these limits - they lead to better architecture.
