export function usePageSetup({
  title,
  description,
  icon,
  image,
  keywords,
}: {
  title: string;
  description: string;
  icon: string;
  image: string;
  keywords: string[];
}) {
  useHead({
    title: title,
    link: [
      {
        rel: "icon",
        href: icon,
      },
      {
        rel: "apple-touch-icon",
        href: icon,
      },
    ],
    meta: [
      {
        name: "description",
        content: description,
      },
      {
        name: "keywords",
        content: keywords.join(", "),
      },
    ],
  });

  useSeoMeta({
    title,
    ogTitle: title,
    ogImage: image,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    description,
  });

  // defineOgImageComponent("Frame", {
  //   description,
  //   image,
  //   icon
  // })
}
