#!/usr/bin/env bun
import { writeFileSync } from "node:fs"
import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { type ZodTypeAny, z } from "zod"
import * as schemas from "../server/utils/schemas"

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

for (const [name, schema] of Object.entries(schemas)) {
  if (name.endsWith("Schema") && (schema as ZodTypeAny)?.safeParse) {
    registry.register(name, schema as ZodTypeAny)
  }
}

const generator = new OpenApiGeneratorV31(registry.definitions)

const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Dave.io API",
    version: "1.0.0",
    description: "Automatically generated OpenAPI specification"
  }
})

writeFileSync("public/openapi.json", JSON.stringify(doc, null, 2))
console.log("Generated public/openapi.json")
