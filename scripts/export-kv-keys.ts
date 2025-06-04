#!/usr/bin/env bun
import fs from "node:fs"
import path from "node:path"
import { $ } from "bun"
import yaml from "js-yaml"

async function exportKVKeysToYAML() {
  try {
    console.log("📝 Fetching KV keys from Cloudflare...")

    // Run wrangler command to get all keys from DATA binding in remote mode
    // Pipe to cat to avoid pager issues
    const result = await $`bun run wrangler kv key list --binding DATA --remote | cat`.quiet()

    if (result.exitCode !== 0) {
      throw new Error(`Failed to fetch KV keys. Exit code: ${result.exitCode}`)
    }

    // Extract and parse the JSON output
    const outputText = result.text().trim()

    // Find the start of the JSON array (wrangler output may include other text)
    const jsonStartIndex = outputText.indexOf("[")
    if (jsonStartIndex === -1) {
      throw new Error("Could not find JSON data in the command output")
    }

    // Find the end of the JSON array
    const jsonEndIndex = outputText.lastIndexOf("]") + 1
    if (jsonEndIndex <= jsonStartIndex) {
      throw new Error("Could not find the end of JSON data in the command output")
    }

    // Extract just the JSON part
    const jsonText = outputText.substring(jsonStartIndex, jsonEndIndex)

    try {
      // Parse the JSON to get all key names
      const keyObjects = JSON.parse(jsonText)

      console.log("🔑 Found %d keys in the KV namespace", keyObjects.length)
      console.log("📥 Fetching values for each key (this may take a while)...")

      // Create a dictionary to store key-value pairs
      // biome-ignore lint/suspicious/noExplicitAny: necessary for JSON parsing
      const kvPairs: Record<string, any> = {}

      // Track progress
      let completedCount = 0
      const totalCount = keyObjects.length

      // Process keys in batches to avoid overwhelming the system
      const batchSize = 5
      for (let i = 0; i < keyObjects.length; i += batchSize) {
        const batch = keyObjects.slice(i, i + batchSize)

        // Process batch in parallel
        await Promise.all(
          // biome-ignore lint/suspicious/noExplicitAny: KV key objects from wrangler have unknown structure
          batch.map(async (keyObj: any) => {
            const keyName = keyObj.name
            try {
              // Fetch the value for this key
              const valueResult =
                await $`bun run wrangler kv key get "${keyName}" --binding DATA --remote | cat`.quiet()

              if (valueResult.exitCode !== 0) {
                console.warn("⚠️ Failed to fetch value for key '%s'. Skipping.", keyName)
                return
              }

              const valueText = valueResult.text().trim()

              // Try to parse as JSON if it looks like JSON
              if (
                (valueText.startsWith("{") && valueText.endsWith("}")) ||
                (valueText.startsWith("[") && valueText.endsWith("]"))
              ) {
                try {
                  kvPairs[keyName] = JSON.parse(valueText)
                } catch {
                  // If parsing fails, store as string
                  kvPairs[keyName] = valueText
                }
              } else {
                // Store as string
                kvPairs[keyName] = valueText
              }
            } catch (error) {
              console.warn("⚠️ Error fetching value for key '%s':", keyName, error)
            } finally {
              completedCount++
              if (completedCount % 10 === 0 || completedCount === totalCount) {
                console.log(
                  "⏳ Progress: %d/%d keys processed (%d%%)",
                  completedCount,
                  totalCount,
                  Math.round((completedCount / totalCount) * 100)
                )
              }
            }
          })
        )
      }

      console.log("✅ All %d values fetched successfully", completedCount)

      // Convert dictionary to YAML
      const yamlOutput = yaml.dump(kvPairs, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        quotingType: '"'
      })

      // Write YAML to file
      const outputPath = path.resolve(process.cwd(), "kv-keys.yaml")
      fs.writeFileSync(outputPath, yamlOutput, "utf8")

      console.log("✅ KV keys and values successfully exported to: %s", outputPath)
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError)
      console.error("JSON text extracted: %s", jsonText)
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Error exporting KV keys:", error)
    process.exit(1)
  }
}

// Execute the main function
exportKVKeysToYAML()
