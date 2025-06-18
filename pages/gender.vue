<template>
  <div
    class="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col py-12 px-4 relative overflow-hidden"
  >
    <Background />

    <GenderFloatingChatButton />

    <div class="relative z-10 max-w-5xl mx-auto space-y-8">
      <GenderPageHeader />

      <!-- Non-What Section -->
      <GenderInfoCard title="🤔 Non-What?" color="pink">
        <p class="text-neutral-300 leading-relaxed">
          <strong class="text-pink-300">Non-binary.</strong> The gender binary - that is, male and female - is
          increasingly seen as outdated and restrictive for no good reason. Non-binary people have been around for all
          of human history, but it's only fairly recently that we're starting to be formally defined in terms of
          sociological theory.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          Being non-binary or otherwise genderqueer is more complicated than 'somewhere between male and female'. Gender
          is distinct from sex, and refers to a fairly nebulous psychological, cultural, and sociological identity.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          In fact, to us, gender isn't a simple line between male and female. There are other axes to it, ones which
          don't have convenient names yet. Our gender identity shifts around in this multidimensional space, where
          gender is a strange, variable, often inscrutable haze. ✨
        </p>
        <div class="bg-pink-900/20 p-4 rounded-lg border border-pink-400/30">
          <p class="text-pink-200 text-sm">
            💡 <strong>Pro tip:</strong> For brevity, people like me often use the contraction 'enby' (singular) or
            'enbies' (plural) to refer to ourselves - the spoken form of "NB", for "Non Binary".
          </p>
        </div>
      </GenderInfoCard>

      <!-- Plot Twist Section -->
      <GenderInfoCard title="😅 Plot Twist: I Thought I Was Cis Too" color="blue">
        <p class="text-neutral-300 leading-relaxed">
          First, a definition - <strong class="text-blue-300">cisgender</strong>, or 'cis', people have an assigned
          gender at birth matching their actual gender. It's the opposite of transgender.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          For a very long time, I fully believed that I <em>was</em> cisgender. A couple of years ago, a trans developer
          posted something on Twitter which made me stop and think.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          When you feel a thing so regularly, you just assume that it's part of the normal human experience. Frequently
          having times you wish you could interact with the world being seen as feminine, envying people who get
          feminine presentation for free? Turns out those are things which cis people don't experience.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          It was particularly confusing because - and this is why I never pursued it - it wasn't the case all the time.
          I've always felt 'somewhere in the middle' and pursued androgyny. While I had the occasional wish to present
          femme, I rarely (if ever) had the wish to present more masculine.
        </p>
      </GenderInfoCard>

      <!-- Transgender Question Section -->
      <GenderInfoCard title="🏳️‍⚧️ So Are Non-Binary People Transgender?" color="purple">
        <p class="text-neutral-300 leading-relaxed">
          I do consider myself transgender, but with hesitation and awareness of privilege.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          That depends who you ask. Some feel the label to be appropriate, some don't. In terms of dictionary
          definitions, yes - the gender we were assigned at birth does not match our actual gender, and never has.
          There's a complication to it, which is that the construction of the word 'transgender' implies alternation
          from one binary to another, and so some people aren't comfortable with it.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          There's also the factor with which I have trouble, which is that it feels like appropriating someone else's
          struggle. Non-binary people do experience dysphoria and have trouble passing, but it's different from someone
          who is binary transgender.
        </p>
      </GenderInfoCard>

      <!-- Binary Myth Section -->
      <GenderInfoCard title='🙄 "But There Are Only Two Genders!"' color="red">
        <p class="text-neutral-300 leading-relaxed">
          I think it's very likely that you're conflating <strong class="text-red-300">sex</strong> and
          <strong class="text-red-300">gender</strong> here. Sex is determined by your genes, and relates to the
          biological differentiation of your body. Gender is distinct, and refers to a fairly nebulous psychological,
          cultural, and sociological identity. 🧬
        </p>
        <p class="text-neutral-300 leading-relaxed">
          But sex isn't binary either! Most of us are aware of sexual differentiation resolving somewhere other than the
          extremes of 'male' and 'female', referred to as being intersex, and the perception we have is that it's rare.
        </p>
        <p class="text-neutral-300 leading-relaxed">
          Studies suggest that while sex differentiation exists on a single axis, it's actually quite common for a
          person to be somewhere between the extremes. Science is cool like that.
        </p>
      </GenderInfoCard>

      <!-- Grammar Lesson Section -->
      <GenderInfoCard title='"They" Is Plural, Not Singular!' color="green">
        <p class="text-neutral-300 leading-relaxed">
          You're not the first person to have that response, and you are
          <strong class="text-green-300">objectively wrong</strong>.
        </p>
        <p class="text-neutral-300 leading-relaxed mb-4">
          Consider the following sentences, which while admittedly somewhat contrived, scan naturally:
        </p>
        <div class="bg-green-900/20 p-4 rounded-lg border border-green-400/30 space-y-2">
          <p class="text-green-200">
            • <em>"When I tell somebody a joke, <strong>they</strong> laugh."</em>
          </p>
          <p class="text-green-200">
            • <em>"When I greet a friend, I hug <strong>them</strong>."</em>
          </p>
          <p class="text-green-200">
            • <em>"When somebody does not get a haircut, <strong>their</strong> hair grows long."</em>
          </p>
          <p class="text-green-200">
            • <em>"If my mobile phone runs out of power, a friend lets me borrow <strong>theirs</strong>."</em>
          </p>
          <p class="text-green-200">
            • <em>"Each child dresses <strong>themself</strong>."</em>
          </p>
        </div>
        <p class="text-neutral-300 leading-relaxed mt-4">
          The fact is that you use the singular <strong>they</strong> every day. You just don't think about it, and
          that's why it <em>feels</em> artificial. But it isn't.
        </p>
      </GenderInfoCard>

      <!-- Resources Section -->
      <GenderInfoCard title="💭 More Questions?" color="cyan">
        <GenderResourcesGrid />
      </GenderInfoCard>

      <!-- Chatbot Placeholder -->
      <GenderChatbotPlaceholder />

      <!-- Back Button -->
      <div class="text-center pt-8">
        <NuxtLink
          to="/"
          @click="handleBackClick"
          class="inline-flex items-center px-6 py-4 text-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg"
        >
          <Icon name="i-mdi-arrow-left" class="mr-3 w-6 h-6" />
          🏠 Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../components/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderChatbotPlaceholder from "../components/GenderChatbotPlaceholder.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderFloatingChatButton from "../components/GenderFloatingChatButton.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderInfoCard from "../components/GenderInfoCard.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderPageHeader from "../components/GenderPageHeader.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderResourcesGrid from "../components/GenderResourcesGrid.vue"

// Set page title and meta
useHead({
  title: "🏳️‍⚧️ Gender Identity & Pronouns - dave.io",
  meta: [
    {
      name: "description",
      content:
        "Dave Williams' journey with non-binary gender identity, using they/them pronouns. A friendly, educational guide to understanding gender diversity."
    },
    {
      name: "keywords",
      content:
        "non-binary, pronouns, they/them, gender identity, LGBTQ+, transgender, enby, inclusion, respect, gender diversity"
    },
    {
      property: "og:title",
      content: "Gender Identity & Pronouns - dave.io"
    },
    {
      property: "og:description",
      content: "Understanding non-binary gender identity and they/them pronouns - a friendly educational guide"
    }
  ]
})

// Page logging
const { logPageVisit, logInteraction } = usePageLogging()

onMounted(() => {
  // Log page visit
  logPageVisit("/gender", {
    title: "gender-identity-guide",
    colorMode: "dark",
    services: ["web"]
  })
})

// Track back button clicks
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const handleBackClick = () => {
  logInteraction("click", "navigation", { action: "back-to-home", from: "gender" })
}
</script>

<style scoped>
/* Additional styling if needed */
</style>
