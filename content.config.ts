// import { defineCollection, defineContentConfig } from "@nuxt/content"
// import { z } from "zod"

// export default defineContentConfig({
//   collections: {
//     docs: defineCollection({
//       // Specify the type of content in this collection
//       type: "page",
//       // Load every file inside the `content` directory
//       source: {
//         include: "blog/**.md",
//         prefix: "/blog",
//       },
//       schema: z.object({
//         date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
//         tags: z.array(z.string().min(2).max(30)),
//         title: z.string().min(2).max(100),
//       }),
//     }),
//   },
// })
