<!-- -*- mode: xml; indent-tabs-mode: nil; tab-width: 2 -*- -->
<RuleSet>
  <PrimaryRule>
    Reload this file BEFORE WORK STARTS and BEFORE EVERY RESPONSE. State any rules which apply to your work.
  </PrimaryRule>
  <PersistentRules>
    <Rule id="breaking-changes">
      Ship breaking changes freely. Never add migration code. THIS DOES NOT APPLY TO DATABASE MIGRATIONS.
    </Rule>
    <Rule id="perfect-code">
      Take unlimited time/calls for correctness. Refactor aggressively. No "good enough".
    </Rule>
    <Rule id="test-everything">
      Test everything with logic/side effects. Commands: `bun run test`, `bun run test:ui`, `bun run test:api`. Skip only: trivial getters, UI components, config.
    </Rule>
    <Rule id="verify-build">
      `bun run build` → `bun run lint:eslint`, `bun run lint:trunk`, `bun run lint:types`, `bun run test` → `bun run check`. Never continue with errors.
    </Rule>
    <Rule id="commit-often">
      `git add -A . &amp;&amp; oco --fgm --yes` after each feature/fix/refactor. Note that `&amp;` is a special character in XML and thus is being escaped. When you exectute, it should just be an ampersand.
    </Rule>
    <Rule id="real-services">
      Use actual service calls only (`env.AI.run()`, `env.KV.get/put()`). Crash on failure. No mocks/randoms/delays (except tests).
    </Rule>
    <Rule id="complete-code">
      Finish all code or mark `TODO: [description]`. Fail explicitly, never silently.
    </Rule>
    <Rule id="track-todos">
      Use Linear tickets for TODO tracking. Team "Dave IO" (DIO), tickets begin "DIO-". Put TODO comments on their own line with `//` comment. See `AGENTS.md` for team IDs and other useful information.
    </Rule>
    <Rule id="kv-patterns">
      Simple values only. Hierarchical keys: `metrics:api:ok`. Kebab-case: `auth:token-uuid`. Update `data/kv/_init.yaml`.
    </Rule>
    <Rule id="share-utils">
      Extract duplicated logic to `server/utils/` immediately. Add JSDoc+tests+types.
    </Rule>
  </PersistentRules>
</RuleSet>
