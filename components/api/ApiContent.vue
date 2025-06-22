<template>
  <div class="space-y-6">
    <ApiPageHeader />

    <!-- What's This About Section -->
    <ApiInfoCard title="🤨 What's This About?" color="yellow">
      <p class="text-text leading-relaxed">Yes. <strong class="text-yellow">Of course there's an API</strong>.</p>
      <p class="text-text leading-relaxed">
        It started as a simple way to serve some images and somehow evolved into a full-blown JWT-authenticated,
        Cloudflare Workers-powered, over-engineered monster. But hey, at least it's fast. ⚡
      </p>
      <p class="text-text leading-relaxed">
        The API powers various features on this site and provides programmatic access to some services. It's built on
        Nuxt 3, runs on Cloudflare's edge network, and has more authentication than a government facility.
      </p>
      <div class="bg-yellow/20 p-4 rounded-lg border border-yellow/30">
        <p class="text-yellow text-sm">
          💡 <strong>Fun fact:</strong> This API probably handles more authentication flows than actual requests.
        </p>
      </div>
    </ApiInfoCard>

    <!-- Authentication Section -->
    <ApiInfoCard title="🔐 Authentication" color="purple">
      <p class="text-text leading-relaxed">The API uses JWT tokens.</p>
      <div class="mt-4">
        <h3 class="text-purple font-semibold mb-2">Using Authentication</h3>
        <p class="text-sm text-subtext0 mt-2">Pass your JWT as a Bearer token or a <code>token</code> GET parameter.</p>
      </div>
    </ApiInfoCard>

    <!-- Public Endpoints Section -->
    <ApiInfoCard title="🌍 Public Endpoints" color="green">
      <p class="text-text leading-relaxed mb-4">
        These endpoints are available to everyone. Use them responsibly, or don't - I'm not your dad.
      </p>
      <div class="space-y-4">
        <div>
          <h3 class="text-green font-semibold mb-2">Health Check</h3>
          <p class="text-sm text-subtext0 mt-2">
            The classic ping-pong. Confirms the API hasn't caught fire and returns some information about your request.
          </p>
          <p class="text-sm text-subtext0 mt-2">Could be used as a "what is my IP" at a push.</p>
        </div>
        <div>
          <h3 class="text-green font-semibold mb-2">Dashboards</h3>
          <p class="text-sm text-subtext0 mt-2">
            Generates dashboard data for dashboard apps which display dashboards.
          </p>
        </div>
      </div>
    </ApiInfoCard>

    <!-- Protected Endpoints Section -->
    <ApiInfoCard title="🚪 Protected Endpoints" color="red">
      <p class="text-text leading-relaxed mb-4">
        These endpoints require authentication. Without proper tokens, you'll get a 401 faster than you can say
        "unauthorized".
      </p>

      <div class="space-y-4">
        <div>
          <h3 class="text-red font-semibold mb-2">Alt Text Generator</h3>
          <p class="text-sm text-subtext0 mb-2">Generates alt text for an image using AI.</p>
        </div>
        <div>
          <h3 class="text-red font-semibold mb-2">Ticket Enrichment</h3>
          <p class="text-sm text-subtext0 mb-2">
            Got a ticket with a description just containing a URL, image, or single sentence of text? Let AI go into
            detail for you.
          </p>
        </div>
        <div>
          <h3 class="text-red font-semibold mb-2">Image Optimisation</h3>
          <p class="text-sm text-subtext0 mb-2">Make your image smaller and more better.</p>
        </div>
      </div>
    </ApiInfoCard>

    <!-- Getting Started Section -->
    <ApiInfoCard title="🚀 Getting Started" color="cyan">
      <p class="text-text leading-relaxed mb-4">Want to use the API? Here's the quickest way to get started:</p>

      <div class="space-y-4">
        <div>
          <h3 class="text-cyan font-semibold mb-2">Test the Ping Endpoint</h3>
          <ApiExampleBlock code="curl https://dave.io/api/ping" />
          <p class="text-sm text-subtext0 mt-2">
            Or, if you want pretty and formatted JSON, and have
            <code>jq</code> installed
          </p>
          <ApiExampleBlock code="curl https://dave.io/api/ping | jq" />
          <p class="text-sm text-subtext0 mt-2">If this works, congrats! The API is alive.</p>
        </div>

        <div>
          <h3 class="text-cyan font-semibold mb-2">Need Authentication?</h3>
          <p class="text-text text-sm mb-2">Need a JWT to call any protected endpoints? Ask me.</p>
        </div>
      </div>

      <div class="bg-cyan/20 p-4 rounded-lg border border-cyan/30 mt-4">
        <p class="text-cyan text-sm">
          <Icon name="i-heroicons-light-bulb" class="mr-2" />
          The API runs on Cloudflare Workers, so it's distributed globally. You'll always hit the nearest edge location.
        </p>
      </div>
    </ApiInfoCard>

    <!-- Back Button -->
    <BackToHomeButton from="api" />
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import BackToHomeButton from "../ui/BackToHomeButton.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ApiExampleBlock from "./ApiExampleBlock.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ApiInfoCard from "./ApiInfoCard.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ApiPageHeader from "./ApiPageHeader.vue"
</script>
