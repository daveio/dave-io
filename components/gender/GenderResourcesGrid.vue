<template>
  <div class="space-y-4">
    <p class="text-neutral-300 leading-relaxed mb-4">Let me link a few resources - they might answer your question:</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink v-for="resource in resources" :key="resource.title" :to="resource.url" target="_blank"
        class="inline-flex items-center justify-start px-4 py-3 border border-cyan-400 text-cyan-300 bg-transparent rounded-md font-medium hover:bg-cyan-400/10 transition-colors">
        <Icon :name="resource.icon" class="mr-2 w-5 h-5" />
        <strong>{{ resource.title }}</strong>
      </NuxtLink>
    </div>
    <div class="bg-cyan-900/20 p-4 rounded-lg border border-cyan-400/30 mt-6">
      <p class="text-cyan-200">
        💌 If you can't find answers from this piece or any of the above, that's okay! Ask me. There are plenty of ways
        to get in touch with me on the main page. Expect a delay in my reply, it's nothing personal.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Resource {
  title: string
  url: string
  icon: string
}

// biome-ignore lint/correctness/noUnusedVariables: Used in template v-for
const resources: Resource[] = [
  {
    title: "The Language of Gender",
    url: "https://www.genderspectrum.org/the-language-of-gender/",
    icon: "i-mdi-book-open-page-variant"
  },
  {
    title: "Understanding Gender",
    url: "https://www.genderspectrum.org/quick-links/understanding-gender/",
    icon: "i-mdi-lightbulb"
  },
  {
    title: "Teen Vogue Guide",
    url: "https://www.teenvogue.com/story/what-is-non-binary-gender",
    icon: "i-mdi-newspaper"
  },
  {
    title: "For Parents",
    url: "https://lifeoutsidethebinary.com/post/96149381358/so-your-child-is-nonbinary-a-guide-for-parents",
    icon: "i-mdi-account-child"
  },
  {
    title: "Psychology Guide",
    url: "https://www.verywellmind.com/what-does-it-mean-to-be-non-binary-or-have-non-binary-gender-4172702",
    icon: "i-mdi-brain"
  },
  {
    title: "Wikipedia: Non-binary gender",
    url: "https://en.wikipedia.org/wiki/Non-binary_gender",
    icon: "i-mdi-wikipedia"
  }
]
</script>
