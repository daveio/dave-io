export function usePageSetup({
  title,
  description,
  icon,
  image,
  keywords,
}: {
  title?: string
  description?: string
  icon?: string
  image?: string
  keywords?: string[]
}) {
  const fullTitle = `${title} @ dave.io`

  useHead({
    link: [
      {
        rel: "icon",
        href: icon || "/images/icon.ico",
      },
      {
        rel: "apple-touch-icon",
        href: icon || "/images/icon.webp",
      },
    ],
    meta: [
      {
        name: "description",
        content: description || "Personal site of Dave Williams",
      },
      {
        name: "keywords",
        content:
          keywords?.join(", ") ||
          "dave.io, Dave Williams, personal site, portfolio, blog, projects, web development, programming, technology, software engineer",
      },
    ],
  })

  useSeoMeta({
    description: description || "Personal site of Dave Williams",
    ogImage: image || "/images/social.webp",
    ogTitle: fullTitle,
    ogType: "website",
    title: title,
    twitterCard: "summary_large_image",
    twitterDescription: description || "Personal site of Dave Williams",
    twitterImage: image || "/images/social.webp",
    twitterTitle: fullTitle,
  })
}
