<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col py-12 px-4 relative overflow-hidden">
    <Background />

    <!-- Floating Chat Button -->
    <div class="fixed bottom-6 left-6 z-50">
      <UTooltip text="Ask me about gender identity! (Coming Soon)" :popper="{ placement: 'top' }">
        <UButton
          color="primary"
          size="lg"
          icon="i-mdi-chat-question"
          :ui="{ rounded: 'rounded-full' }"
          class="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse"
          disabled
        />
      </UTooltip>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          🌈 Hi, I'm Non-Binary! 🏳️‍⚧️
        </h1>
        <p class="text-xl text-gray-300 mb-4">
          I use <strong class="text-pink-400">they/them/theirs</strong> pronouns
        </p>
        <p class="text-lg text-gray-400">
          You probably have questions. I'm still a little uncomfortable discussing it all outside queer circles, so let me give you a primer 💜
        </p>
      </div>

      <!-- Chatbot Placeholder -->
      <UCard class="mb-8 border-2 border-dashed border-purple-400/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div class="text-center py-6">
          <div class="text-6xl mb-4">🤖✨</div>
          <h3 class="text-2xl font-bold text-purple-300 mb-2">Gender Identity Chatbot</h3>
          <p class="text-gray-300 mb-4">
            Coming soon! An AI assistant to help answer your questions about gender identity, pronouns, and creating inclusive spaces.
          </p>
          <UButton color="purple" variant="outline" disabled>
            <UIcon name="i-mdi-robot-excited" class="mr-2" />
            Launch Chat (Coming Soon)
          </UButton>
        </div>
      </UCard>

      <!-- Non-What Section -->
      <UCard class="border-l-4 border-pink-400 bg-gradient-to-r from-pink-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-pink-400 mb-4">🤔 Non-What?</h2>
          <p class="text-gray-300 leading-relaxed">
            <strong class="text-pink-300">Non-binary.</strong> The gender binary - that is, male and female - is increasingly seen as outdated and
            restrictive for no good reason. Non-binary people have been around for all of human history, but it's
            only fairly recently that we're starting to be formally defined in terms of sociological theory.
          </p>
          <p class="text-gray-300 leading-relaxed">
            Being non-binary or otherwise genderqueer is more complicated than 'somewhere between male and
            female'. Gender is distinct from sex, and refers to a fairly nebulous psychological, cultural, and
            sociological identity. 🧠💭
          </p>
          <p class="text-gray-300 leading-relaxed">
            In fact, to us, gender isn't a simple line between male and female. There are other axes to it, ones
            which don't have convenient names yet. Our gender identity shifts around in this multidimensional
            space, where gender is a strange, variable, often inscrutable haze. ✨
          </p>
          <div class="bg-pink-900/20 p-4 rounded-lg border border-pink-400/30">
            <p class="text-pink-200 text-sm">
              💡 <strong>Pro tip:</strong> For brevity, people like me often use the contraction 'enby' (singular) or 'enbies' (plural) to refer
              to ourselves - the spoken form of "NB" for "Non Binary".
            </p>
          </div>
        </div>
      </UCard>

      <!-- Plot Twist Section -->
      <UCard class="border-l-4 border-blue-400 bg-gradient-to-r from-blue-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-blue-400 mb-4">😅 Plot Twist: I Thought I Was Cis Too</h2>
          <p class="text-2xl font-bold text-blue-300 mb-4">So did I.</p>
          <p class="text-gray-300 leading-relaxed">
            First, a definition - <strong class="text-blue-300">cisgender</strong>, or 'cis', people have an assigned gender at birth matching their
            actual gender. It's the opposite of transgender.
          </p>
          <p class="text-gray-300 leading-relaxed">
            For a very long time, I fully believed that I <em>was</em> cisgender. A couple of years ago, a trans developer posted something on Twitter which
            made me stop and think. 🤯
          </p>
          <p class="text-gray-300 leading-relaxed">
            When you feel a thing so regularly, you just assume that it's part of the normal human experience.
            Frequently having times you wish you could interact with the world being seen as feminine, envying
            people who get feminine presentation for free? Turns out those are things which cis people don't
            experience. 🙃
          </p>
          <p class="text-gray-300 leading-relaxed">
            It was particularly confusing because - and this is why I never pursued it - it wasn't the case all
            the time. I've always felt 'somewhere in the middle' and pursued androgyny. While I had the occasional
            wish to present femme, I rarely (if ever) had the wish to present more masculine. 💅
          </p>
        </div>
      </UCard>

      <!-- Transgender Question Section -->
      <UCard class="border-l-4 border-purple-400 bg-gradient-to-r from-purple-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-purple-400 mb-4">🏳️‍⚧️ So Are Non-Binary People Transgender?</h2>
          <p class="text-gray-300 leading-relaxed">
            I do consider myself transgender, but with hesitation and awareness of privilege. 💜
          </p>
          <p class="text-gray-300 leading-relaxed">
            That depends who you ask. Some feel the label to be appropriate, some don't. In terms of dictionary
            definitions, yes - the gender we were assigned at birth does not match our actual gender, and never
            has. There's a complication to it, which is that the construction of the word 'transgender' implies
            alternation from one binary to another, and so some people aren't comfortable with it.
          </p>
          <p class="text-gray-300 leading-relaxed">
            There's also the factor with which I have trouble, which is that it feels like appropriating someone
            else's struggle. Non-binary people do experience dysphoria and have trouble passing, but it's
            different from someone who is binary transgender. 🤷‍♀️
          </p>
        </div>
      </UCard>

      <!-- Binary Myth Section -->
      <UCard class="border-l-4 border-red-400 bg-gradient-to-r from-red-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-red-400 mb-4">🙄 "But There Are Only Two Genders!"</h2>
          <p class="text-gray-300 leading-relaxed">
            I think it's very likely that you're conflating <strong class="text-red-300">sex</strong> and <strong class="text-red-300">gender</strong> here. Sex is determined by your genes,
            and relates to the biological differentiation of your body. Gender is distinct, and refers to a fairly
            nebulous psychological, cultural, and sociological identity. 🧬
          </p>
          <p class="text-gray-300 leading-relaxed">
            But sex isn't binary either! Most of us are aware of sexual differentiation resolving somewhere other
            than the extremes of 'male' and 'female', referred to as being intersex, and the perception we have is that it's rare.
          </p>
          <p class="text-gray-300 leading-relaxed">
            Studies suggest that while sex differentiation exists on a single axis, it's actually quite common for
            a person to be somewhere between the extremes. Science is cool like that! 🔬✨
          </p>
        </div>
      </UCard>

      <!-- Grammar Lesson Section -->
      <UCard class="border-l-4 border-green-400 bg-gradient-to-r from-green-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-green-400 mb-4">📚 "'They' Is Plural, Not Singular!"</h2>
          <p class="text-gray-300 leading-relaxed">
            You're not the first person to have that response, and you are <strong class="text-green-300">objectively wrong</strong>. 😏
          </p>
          <p class="text-gray-300 leading-relaxed mb-4">
            Consider the following sentences, which while admittedly somewhat contrived, scan naturally:
          </p>
          <div class="bg-green-900/20 p-4 rounded-lg border border-green-400/30 space-y-2">
            <p class="text-green-200">• <em>"When I tell somebody a joke, <strong>they</strong> laugh."</em></p>
            <p class="text-green-200">• <em>"When I greet a friend, I hug <strong>them</strong>."</em></p>
            <p class="text-green-200">• <em>"When somebody does not get a haircut, <strong>their</strong> hair grows long."</em></p>
            <p class="text-green-200">• <em>"If my mobile phone runs out of power, a friend lets me borrow <strong>theirs</strong>."</em></p>
            <p class="text-green-200">• <em>"Each child dresses <strong>themself</strong>."</em></p>
          </div>
          <p class="text-gray-300 leading-relaxed mt-4">
            The fact is that you use the singular <strong>they</strong> every day. You just don't think about it,
            and that's why it feels artificial. 🎭
          </p>
        </div>
      </UCard>

      <!-- Icon Acknowledgment -->
      <UCard class="border-l-4 border-yellow-400 bg-gradient-to-r from-yellow-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-yellow-400 mb-4">🎨 "But the Icon You Used Is Inherently Binary!"</h2>
          <p class="text-gray-300 leading-relaxed">
            I know. 😔 If you come up with a better option to represent gender identity which works as a monochrome
            icon, do enbies and genderqueer people in general a favour and
            <UButton to="https://github.com/FortAwesome/Font-Awesome/issues" target="_blank" variant="link" class="text-yellow-300 hover:text-yellow-200">
              let the Font Awesome team know! 🎯
            </UButton>
          </p>
        </div>
      </UCard>

      <!-- Resources Section -->
      <UCard class="border-l-4 border-cyan-400 bg-gradient-to-r from-cyan-900/10 to-transparent">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-cyan-400 mb-4">💭 More Questions?</h2>
          <p class="text-gray-300 leading-relaxed mb-4">
            First, let me link a few resources - they might answer your question:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UButton to="https://www.genderspectrum.org/the-language-of-gender/" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-book-open-page-variant" class="mr-2" />
              The Language of Gender
            </UButton>
            <UButton to="https://www.genderspectrum.org/quick-links/understanding-gender/" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-lightbulb" class="mr-2" />
              Understanding Gender
            </UButton>
            <UButton to="https://www.teenvogue.com/story/what-is-non-binary-gender" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-magazine" class="mr-2" />
              Teen Vogue Guide ⭐
            </UButton>
            <UButton to="https://lifeoutsidethebinary.com/post/96149381358/so-your-child-is-nonbinary-a-guide-for-parents" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-account-child" class="mr-2" />
              For Parents
            </UButton>
            <UButton to="https://www.verywellmind.com/what-does-it-mean-to-be-non-binary-or-have-non-binary-gender-4172702" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-brain" class="mr-2" />
              Psychology Guide
            </UButton>
            <UButton to="https://en.wikipedia.org/wiki/Non-binary_gender" target="_blank" variant="outline" color="cyan" class="justify-start">
              <UIcon name="i-mdi-wikipedia" class="mr-2" />
              Wikipedia
            </UButton>
          </div>
          <div class="bg-cyan-900/20 p-4 rounded-lg border border-cyan-400/30 mt-6">
            <p class="text-cyan-200">
              💌 If you can't find answers from this piece or any of the above, that's okay! Ask me. 
              There are plenty of ways to get in touch with me on the main page. Expect a delay in my reply.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Back Button -->
      <div class="text-center pt-8">
        <UButton to="/" color="primary" size="xl" icon="i-mdi-arrow-left" @click="handleBackClick" 
                 class="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          ← Back to Home 🏠
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Background from "../components/Background.vue"

// Set page title and meta
useHead({
  title: "🌈 Gender Identity & Pronouns - dave.io",
  meta: [
    {
      name: "description",
      content: "Dave Williams' journey with non-binary gender identity, using they/them pronouns. A friendly, educational guide to understanding gender diversity."
    },
    {
      name: "keywords",
      content: "non-binary, pronouns, they/them, gender identity, LGBTQ+, transgender, enby, inclusion, respect, gender diversity"
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
