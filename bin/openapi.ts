#!/usr/bin/env bun
import { writeFileSync } from "node:fs"
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi"
import { type ZodTypeAny, z } from "zod"
import { scanApiEndpoints } from "../server/utils/endpoint-scanner"
import * as schemas from "../server/utils/schemas"

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

// Register all Zod schemas
for (const [name, schema] of Object.entries(schemas)) {
  if (name.endsWith("Schema") && (schema as ZodTypeAny)?.safeParse) {
    registry.register(name, schema as ZodTypeAny)
  }
}

// Register security scheme for JWT Bearer authentication
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token authorization. Include 'Bearer ' prefix."
})

// Auto-discover and register API endpoints
console.log("Scanning API endpoints...")
const discoveredEndpoints = await scanApiEndpoints()
console.log(`Found ${discoveredEndpoints.length} endpoints`)

for (const endpoint of discoveredEndpoints) {
  console.log(`Registering: ${endpoint.method.toUpperCase()} ${endpoint.path}`)
  registry.registerPath({
    method: endpoint.method,
    path: endpoint.path,
    tags: endpoint.tags,
    summary: endpoint.summary,
    description: endpoint.description,
    security: endpoint.security,
    parameters: endpoint.parameters,
    requestBody: endpoint.requestBody,
    responses: endpoint.responses
  })
}

const generator = new OpenApiGeneratorV31(registry.definitions)

const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Dave.io API",
    version: "1.0.0",
    description: "Automatically generated OpenAPI specification from endpoint analysis"
  },
  servers: [
    {
      url: "https://dave.io",
      description: "Production server"
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ]
})

writeFileSync("public/openapi.json", JSON.stringify(doc, null, 2))
console.log("Generated public/openapi.json")
