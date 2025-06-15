<template>
  <div class="mb-4">
    <div class="profile-info-table pb-4">
      <div class="links-row">
        <span class="link-name text-white font-bold">
          <UIcon name="i-mdi-light-gender-transgender" class="mr-2 text-green-200" />
          Pronouns
        </span>
        <ULink
          to="/gender"
          target="_blank"
          class="link-gender"
          @click="handleLinkClick('gender', 'https://dave.io/gender')"
        >
          they/them (learn more)
        </ULink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality
const { logInteraction } = usePageLogging()

// Track link clicks
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const handleLinkClick = (service: string, url: string) => {
  logInteraction("click", "terminal-link", { service, url })
}
</script>

<style scoped>
.profile-info-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.links-row {
  display: contents;
}

.link-name {
  font-weight: 500;
  text-align: right;
  padding-right: 5px;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
}

.link-url {
  word-break: break-all;
}

@media (max-width: 800px) {
  .profile-info-table {
    grid-template-columns: 0.6fr 1.3fr;
    font-size: 0.95em;
    max-width: 100%;
    gap: 0.5rem 1rem;
  }

  .link-name,
  .link-url {
    min-width: 0;
    word-break: break-all;
  }
}
</style>
