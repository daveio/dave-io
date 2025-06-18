<template>
  <div class="space-y-6">
    <ApiPageHeader />

    <!-- What's This About Section -->
    <ApiInfoCard title="🤨 What's This About?" color="yellow">
      <p class="text-text leading-relaxed">
        <strong class="text-yellow">Yes, this personal site has an API.</strong> No, I don't know why either.
      </p>
      <p class="text-text leading-relaxed">
        It started as a simple way to serve some images and somehow evolved into a full-blown JWT-authenticated, 
        Cloudflare Workers-powered, over-engineered monster. But hey, at least it's fast. ⚡
      </p>
      <p class="text-text leading-relaxed">
        The API powers various features on this site and provides programmatic access to some services. 
        It's built on Nuxt 3, runs on Cloudflare's edge network, and has more authentication than a government facility.
      </p>
      <div class="bg-yellow/20 p-4 rounded-lg border border-yellow/30">
        <p class="text-yellow text-sm">
          💡 <strong>Fun fact:</strong> This API probably handles more authentication flows than actual requests.
        </p>
      </div>
    </ApiInfoCard>

    <!-- Public Endpoints Section -->
    <ApiInfoCard title="🌍 Public Endpoints (No Auth Required)" color="green">
      <p class="text-text leading-relaxed mb-4">
        These endpoints are available to everyone. Use them responsibly, or don't - I'm not your supervisor.
      </p>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-green font-semibold mb-2">Health Check</h3>
          <ApiExampleBlock 
            code="curl https://dave.io/api/ping"
            response='{"ok":true,"result":{"message":"pong"},"error":null,"status":{"message":"Success"},"timestamp":"2024-01-01T00:00:00.000Z"}'
          />
          <p class="text-sm text-subtext0 mt-2">The classic ping-pong. Confirms the API hasn't caught fire.</p>
        </div>

        <div>
          <h3 class="text-green font-semibold mb-2">Image Optimization</h3>
          <ApiExampleBlock 
            :code="examples.imageOptimize.code"
            :response="examples.imageOptimize.response"
          />
          <p class="text-sm text-subtext0 mt-2">Optimizes images via Cloudflare Images. Returns a CDN URL that loads faster than your excuses.</p>
        </div>

        <div>
          <h3 class="text-green font-semibold mb-2">AI Ticket Helper</h3>
          <ApiExampleBlock 
            :code="examples.ticketHelper.code"
            :response="examples.ticketHelper.response"
          />
          <p class="text-sm text-subtext0 mt-2">Because writing good ticket titles is hard. Let AI do it.</p>
        </div>
      </div>
    </ApiInfoCard>

    <!-- Authentication Section -->
    <ApiInfoCard title="🔐 Authentication (JWT Because Why Not)" color="purple">
      <p class="text-text leading-relaxed">
        The API uses JWT tokens with hierarchical permissions. It's like RBAC but more confusing.
      </p>
      
      <div class="space-y-3 my-4">
        <div class="bg-base-300 p-4 rounded-lg">
          <h4 class="text-purple font-semibold mb-2">Permission Categories:</h4>
          <ul class="space-y-2 text-sm">
            <li>• <code class="text-purple">api:*</code> - General API access</li>
            <li>• <code class="text-purple">ai:*</code> - AI features (alt text, etc.)</li>
            <li>• <code class="text-purple">dashboard:*</code> - Dashboard metrics</li>
            <li>• <code class="text-purple">admin</code> - Full access (good luck getting this)</li>
            <li>• <code class="text-purple">*</code> - Wildcard (you wish)</li>
          </ul>
        </div>
      </div>

      <p class="text-text leading-relaxed">
        Permissions are hierarchical: <code class="text-purple">api:tokens</code> includes 
        <code class="text-purple">api:tokens:read</code> and <code class="text-purple">api:tokens:write</code>.
      </p>

      <div class="mt-4">
        <h3 class="text-purple font-semibold mb-2">Using Authentication</h3>
        <ApiExampleBlock 
          :code="examples.authExample.code"
          :response="examples.authExample.response"
        />
        <p class="text-sm text-subtext0 mt-2">You can also use <code>?token=YOUR_JWT_TOKEN</code> if headers are too mainstream.</p>
      </div>
    </ApiInfoCard>

    <!-- Protected Endpoints Section -->
    <ApiInfoCard title="🚪 Protected Endpoints (Auth Required)" color="red">
      <p class="text-text leading-relaxed mb-4">
        These endpoints require authentication. Without proper tokens, you'll get a 401 faster than you can say "unauthorized".
      </p>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-red font-semibold mb-2">AI Alt Text Generator</h3>
          <p class="text-sm text-subtext0 mb-2">Requires: <code class="text-red">ai:alt</code> permission</p>
          <ApiExampleBlock 
            :code="examples.altTextAuth.code"
            :response="examples.altTextAuth.response"
          />
        </div>

        <div>
          <h3 class="text-red font-semibold mb-2">Token Management</h3>
          <p class="text-sm text-subtext0 mb-2">Requires: <code class="text-red">api:tokens</code> permission</p>
          <ApiExampleBlock 
            :code="examples.tokenUsage.code"
            :response="examples.tokenUsage.response"
          />
        </div>

        <div>
          <h3 class="text-red font-semibold mb-2">Dashboard Metrics</h3>
          <p class="text-sm text-subtext0 mb-2">Requires: <code class="text-red">dashboard:metrics</code> permission</p>
          <ApiExampleBlock 
            :code="examples.dashboardMetrics.code"
            :response="examples.dashboardMetrics.response"
          />
        </div>
      </div>
    </ApiInfoCard>

    <!-- Rate Limits Section -->
    <ApiInfoCard title="⏱️ Rate Limits & Good Behavior" color="orange">
      <p class="text-text leading-relaxed">
        Currently, there are no hard rate limits because I'm optimistic about humanity. 
        <strong class="text-orange">Please don't make me regret this.</strong>
      </p>
      
      <div class="bg-orange/20 p-4 rounded-lg border border-orange/30 my-4">
        <h4 class="text-orange font-semibold mb-2">Reasonable Usage Guidelines:</h4>
        <ul class="space-y-2 text-sm">
          <li>• Don't hammer the endpoints like it owes you money</li>
          <li>• Cache responses when possible (they include proper cache headers)</li>
          <li>• Use the health check endpoint for monitoring, not the expensive ones</li>
          <li>• If you're making more than 100 requests/minute, maybe chill a bit</li>
        </ul>
      </div>

      <p class="text-text leading-relaxed">
        All requests are logged, so if you're doing something weird, I'll know. And I'll be disappointed.
      </p>
    </ApiInfoCard>

    <!-- Getting Started Section -->
    <ApiInfoCard title="🚀 Getting Started" color="cyan">
      <p class="text-text leading-relaxed mb-4">
        Want to use the API? Here's the quickest way to get started:
      </p>

      <div class="space-y-4">
        <div>
          <h3 class="text-cyan font-semibold mb-2">1. Test the Public Endpoints</h3>
          <ApiExampleBlock 
            code="curl https://dave.io/api/ping"
          />
          <p class="text-sm text-subtext0 mt-2">If this works, congrats! The API is alive.</p>
        </div>

        <div>
          <h3 class="text-cyan font-semibold mb-2">2. Need Authentication?</h3>
          <p class="text-text text-sm mb-2">
            Sorry, tokens aren't publicly available. This is a personal API after all. 
            But if you have a legitimate use case, feel free to reach out. Maybe we can work something out.
          </p>
        </div>

        <div>
          <h3 class="text-cyan font-semibold mb-2">3. Response Format</h3>
          <p class="text-text text-sm mb-2">All responses follow this structure:</p>
          <ApiExampleBlock 
            :code="examples.responseFormat"
          />
        </div>
      </div>

      <div class="bg-cyan/20 p-4 rounded-lg border border-cyan/30 mt-4">
        <p class="text-cyan text-sm">
          <Icon name="i-heroicons-light-bulb" class="mr-2" />
          <strong>Pro tip:</strong> The API is built on Cloudflare Workers, so it's distributed globally. 
          You'll always hit the nearest edge location for minimal latency.
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

// Complex code examples that are hard to inline
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const examples = {
  ticketHelper: {
    code: `curl -X POST -d '{"description":"Fix the thing"}' https://dave.io/api/ai/tickets/title`,
    response: `{"ok":true,"result":{"title":"Fix undefined behavior in production"}}`
  },
  imageOptimize: {
    code: `curl -X POST -F "image=@photo.jpg" https://dave.io/api/images/optimise`,
    response: `{"ok":true,"result":{"id":"BLAKE3_HASH","url":"https://imagedelivery.net/..."}}`
  },
  authExample: {
    code: `curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://dave.io/api/ai/alt?url=https://example.com/image.jpg`,
    response: `{"ok":true,"result":{"altText":"A majestic cat sitting on a keyboard"}}`
  },
  altTextAuth: {
    code: `curl -H "Authorization: Bearer TOKEN" "https://dave.io/api/ai/alt?url=https://example.com/cat.jpg"`,
    response: `{"ok":true,"result":{"altText":"A fluffy orange cat sleeping on a windowsill in afternoon sunlight"}}`
  },
  tokenUsage: {
    code: `curl -H "Authorization: Bearer TOKEN" https://dave.io/api/tokens/UUID/usage`,
    response: `{"ok":true,"result":{"requests":42,"lastUsed":"2024-01-01T00:00:00.000Z"}}`
  },
  dashboardMetrics: {
    code: `curl -H "Authorization: Bearer TOKEN" https://dave.io/api/dashboard/metrics`,
    response: `{"ok":true,"result":{"visitors":1337,"apiCalls":42069}}`
  },
  responseFormat: `// Success
{
  "ok": true,
  "result": {...},
  "error": null,
  "status": {"message": "Success"},
  "timestamp": "ISO-8601"
}

// Error
{
  "ok": false,
  "result": null,
  "error": {"message": "What went wrong"},
  "status": {"message": "Error"},
  "timestamp": "ISO-8601"
}`
}
</script>