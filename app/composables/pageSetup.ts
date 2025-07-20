export function usePageSetup({
  title,
  description,
  icon,
  image,
  keywords
}: {
  title: string
  description: string
  icon: string
  image: string
  keywords: string[]
}) {
  const fullTitle = `${title} @ dave.io`

  useHead({
    title: title,
    link: [
      {
        rel: "icon",
        href: icon
      },
      {
        rel: "apple-touch-icon",
        href: icon
      }
    ],
    meta: [
      {
        name: "description",
        content: description
      },
      {
        name: "keywords",
        content: keywords.join(", ")
      }
    ]
  })

  useSeoMeta({
    description,
    ogImage: image,
    ogTitle: fullTitle,
    ogType: "website",
    title: fullTitle,
    twitterCard: "summary_large_image",
    twitterDescription: description,
    twitterImage: image,
    twitterTitle: fullTitle
  })

  // defineOgImageComponent("Frame", {
  //   description,
  //   image,
  //   icon
  // })
}
