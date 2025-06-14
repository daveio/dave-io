import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import * as schemas from "./schemas"

interface EndpointMetadata {
  method: "get" | "post" | "put" | "delete" | "patch"
  path: string
  tags: string[]
  summary: string
  description: string
  security?: Array<Record<string, string[]>>
  parameters?: Array<{
    name: string
    in: "query" | "path" | "header"
    required?: boolean
    description?: string
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI schema can be any valid JSON schema
    schema: any
  }>
  requestBody?: {
    required?: boolean
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI schema can be any valid JSON schema
    content: Record<string, { schema: any }>
  }
  responses: Record<
    string,
    {
      description: string
      // biome-ignore lint/suspicious/noExplicitAny: OpenAPI schema can be any valid JSON schema
      content?: Record<string, { schema: any }>
    }
  >
}

/**
 * Scan API directory and discover endpoints with their metadata
 */
export async function scanApiEndpoints(): Promise<EndpointMetadata[]> {
  const serverDir = join(process.cwd(), "server")
  const endpoints: EndpointMetadata[] = []

  // Recursive function to scan directories
  function scanDirectory(dir: string, basePath = ""): void {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        const newBasePath = basePath ? `${basePath}/${item}` : item
        scanDirectory(fullPath, newBasePath)
      } else if (item.endsWith(".ts") && !item.includes(".test.")) {
        // Process TypeScript files
        const relativePath = relative(serverDir, fullPath)
        const endpointResults = analyzeEndpointFile(fullPath, relativePath, basePath)
        if (endpointResults) {
          endpoints.push(...endpointResults)
        }
      }
    }
  }

  // Scan both API and routes directories
  const apiDir = join(serverDir, "api")
  const routesDir = join(serverDir, "routes")

  if (readdirSync(serverDir).includes("api")) {
    scanDirectory(apiDir)
  }

  if (readdirSync(serverDir).includes("routes")) {
    scanDirectory(routesDir)
  }

  return endpoints
}

/**
 * Analyze a single endpoint file and extract metadata
 */
function analyzeEndpointFile(filePath: string, relativePath: string, basePath: string): EndpointMetadata[] | null {
  try {
    const content = readFileSync(filePath, "utf-8")

    // Extract method from filename (e.g., "ping.get.ts" -> "get", "optimise.ts" -> handles both GET/POST)
    const fileName = relativePath.split("/").pop()
    if (!fileName) return null
    const fileNameWithoutExt = fileName.replace(".ts", "")

    let method: "get" | "post" | "put" | "delete" | "patch" = "get" // default
    let endpointName = fileNameWithoutExt

    // Check if there's a method in the filename
    const methodMatch = fileNameWithoutExt.match(/\.([a-z]+)$/)
    if (methodMatch?.[1] && ["get", "post", "put", "delete", "patch"].includes(methodMatch[1])) {
      method = methodMatch[1] as "get" | "post" | "put" | "delete" | "patch"
      endpointName = fileNameWithoutExt.replace(`.${method}`, "")
    }

    // Special handling for catch-all routes
    if (endpointName.includes("[...")) {
      // Handle [...path] -> becomes {path}
      endpointName = endpointName.replace(/\[\.\.\.([^\]]+)\]/, "{$1}")
    }

    // Convert file path to API path
    let apiPath: string

    if (relativePath.startsWith("api/")) {
      // Standard API endpoint
      apiPath = `/api/${basePath ? `${basePath}/` : ""}${endpointName}`
    } else if (relativePath.startsWith("routes/")) {
      // Route endpoint (like /go/[slug])
      const routePath = relativePath
        .replace("routes/", "")
        .replace(/\.[^.]+\.ts$/, ".ts")
        .replace(".ts", "")
      apiPath = `/${routePath}`
    } else {
      // Fallback
      apiPath = `/api/${basePath ? `${basePath}/` : ""}${endpointName}`
    }

    // Handle dynamic routes
    apiPath = apiPath.replace(/\[\.\.\.([^\]]+)\]/g, "{$1}") // [...path] -> {path} (do this first)
    apiPath = apiPath.replace(/\[([^\]]+)\]/g, "{$1}") // [uuid] -> {uuid}

    // Handle special endpoint files that support multiple methods
    if (endpointName === "optimise") {
      // This endpoint supports both GET and POST - create multiple endpoints
      return [
        { method: "get", path: apiPath, ...extractEndpointMetadata(content, apiPath, "get") },
        { method: "post", path: apiPath, ...extractEndpointMetadata(content, apiPath, "post") }
      ]
    }

    // Analyze content for schema usage and extract metadata
    const metadata = extractEndpointMetadata(content, apiPath, method)

    return [
      {
        method,
        path: apiPath,
        ...metadata
      }
    ]
  } catch (error) {
    console.warn("Failed to analyze endpoint file:", filePath, error)
    return null
  }
}

/**
 * Extract metadata from endpoint file content
 */
function extractEndpointMetadata(
  content: string,
  path: string,
  method: string
): Omit<EndpointMetadata, "method" | "path"> {
  // Default metadata
  const metadata: Omit<EndpointMetadata, "method" | "path"> = {
    tags: [getTagFromPath(path)],
    summary: generateSummary(path, method),
    description: generateDescription(path, method),
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: schemas.ApiSuccessResponseSchema
          }
        }
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: schemas.ApiErrorResponseSchema
          }
        }
      }
    }
  }

  // Add security for protected endpoints
  if (content.includes("requireAIAuth") || content.includes("authorizeEndpoint")) {
    metadata.security = [{ bearerAuth: [] }]
    metadata.responses["403"] = {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }

  // Detect schema usage and add appropriate request/response schemas
  const schemaUsage = detectSchemaUsage(content)

  if (schemaUsage.requestSchema) {
    metadata.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: schemaUsage.requestSchema
        }
      }
    }

    // Add multipart support for image endpoints
    if (content.includes("parseImageUpload") || content.includes("multipart")) {
      metadata.requestBody.content["multipart/form-data"] = {
        schema: {
          type: "object",
          properties: {
            image: {
              type: "string",
              format: "binary",
              description: "Image file"
            }
          },
          required: ["image"]
        }
      }
    }
  }

  if (schemaUsage.responseSchema) {
    metadata.responses["200"] = {
      description: "Success",
      content: {
        "application/json": {
          schema: schemaUsage.responseSchema
        }
      }
    }
  }

  // Add parameters for dynamic routes
  if (path.includes("{")) {
    metadata.parameters = extractParameters(path, content)
  }

  // Add query parameters for GET endpoints with validation
  if (method === "get" && content.includes("getQuery")) {
    const queryParams = extractQueryParameters(content)
    if (queryParams.length > 0) {
      metadata.parameters = [...(metadata.parameters || []), ...queryParams]
    }
  }

  return metadata
}

/**
 * Detect Zod schema usage in endpoint content
 */
// biome-ignore lint/suspicious/noExplicitAny: Schema detection returns dynamic schema objects
function detectSchemaUsage(content: string): { requestSchema?: any; responseSchema?: any } {
  // biome-ignore lint/suspicious/noExplicitAny: Result object holds dynamic schema references
  const result: { requestSchema?: any; responseSchema?: any } = {}

  // Look for .parse() calls to identify request schemas
  const parseMatches = content.match(/(\w+Schema)\.parse\(/g)
  if (parseMatches?.[0]) {
    const schemaName = parseMatches[0].replace(".parse(", "")
    // @ts-ignore - Dynamic schema access
    result.requestSchema = schemas[schemaName]
  }

  // Look for type annotations to identify response schemas
  const responseTypeMatch = content.match(/Promise<(\w+Response)>/g)
  if (responseTypeMatch?.[0]) {
    const typeName = responseTypeMatch[0].replace(/Promise<|>/g, "")
    const schemaName = `${typeName}Schema`
    // @ts-ignore - Dynamic schema access
    result.responseSchema = schemas[schemaName]
  }

  // Look for specific schemas mentioned in imports or usage
  const schemaImportMatch = content.match(/import.*{([^}]*Schema[^}]*)}.*from.*schemas/s)
  if (schemaImportMatch?.[1]) {
    const importedSchemas = schemaImportMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.endsWith("Schema"))

    // Use the first request-like schema found
    const requestSchemas = importedSchemas.filter(
      (s) => s.includes("Request") || s.includes("Query") || s.includes("Title") || s.includes("Description")
    )
    if (requestSchemas.length > 0) {
      // @ts-ignore - Dynamic schema access
      result.requestSchema = schemas[requestSchemas[0]]
    }

    // Use the first response-like schema found
    const responseSchemas = importedSchemas.filter((s) => s.includes("Response"))
    if (responseSchemas.length > 0) {
      // @ts-ignore - Dynamic schema access
      result.responseSchema = schemas[responseSchemas[0]]
    }
  }

  return result
}

/**
 * Extract parameters from path and content
 */
function extractParameters(
  path: string,
  _content: string
): Array<{
  name: string
  in: "path"
  required: boolean
  description: string
  // biome-ignore lint/suspicious/noExplicitAny: OpenAPI parameter schema can be any valid JSON schema
  schema: any
}> {
  const parameters: Array<{
    name: string
    in: "path"
    required: boolean
    description: string
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI parameter schema can be any valid JSON schema
    schema: any
  }> = []

  // Extract path parameters
  const pathParams = path.match(/{([^}]+)}/g)
  if (pathParams) {
    for (const param of pathParams) {
      const paramName = param.slice(1, -1) // Remove { }

      // biome-ignore lint/suspicious/noExplicitAny: Schema object represents OpenAPI JSON schema
      let schema: any = { type: "string" }
      let description = `${paramName} parameter`

      // Special handling for known parameters
      if (paramName === "uuid") {
        schema = { type: "string", format: "uuid" }
        description = "UUID identifier"
      } else if (paramName === "slug") {
        schema = { type: "string", pattern: "^[a-zA-Z0-9\\-_]+$" }
        description = "URL slug"
      } else if (paramName === "name") {
        description = "Name identifier"
      }

      parameters.push({
        name: paramName,
        in: "path",
        required: true,
        description,
        schema
      })
    }
  }

  return parameters
}

/**
 * Extract query parameters from endpoint content
 */
function extractQueryParameters(content: string): Array<{
  name: string
  in: "query"
  required?: boolean
  description?: string
  // biome-ignore lint/suspicious/noExplicitAny: OpenAPI parameter schema can be any valid JSON schema
  schema: any
}> {
  const parameters: Array<{
    name: string
    in: "query"
    required?: boolean
    description?: string
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI parameter schema can be any valid JSON schema
    schema: any
  }> = []

  // Look for query parameter usage
  if (content.includes("query.url")) {
    parameters.push({
      name: "url",
      in: "query",
      required: true,
      description: "URL parameter",
      schema: { type: "string", format: "uri" }
    })
  }

  if (content.includes("query.quality")) {
    parameters.push({
      name: "quality",
      in: "query",
      required: false,
      description: "Quality parameter (0-100)",
      schema: { type: "number", minimum: 0, maximum: 100 }
    })
  }

  return parameters
}

/**
 * Generate tag from API path
 */
function getTagFromPath(path: string): string {
  if (path.startsWith("/api/ai")) return "AI"
  if (path.startsWith("/api/images")) return "Images"
  if (path.startsWith("/api/tokens")) return "Tokens"
  if (path.startsWith("/api/dashboard")) return "Dashboard"
  if (path.startsWith("/go/")) return "Redirects"
  if (path.startsWith("/api/docs")) return "Documentation"
  return "System"
}

/**
 * Generate summary from path and method
 */
function generateSummary(path: string, method: string): string {
  const pathParts = path.split("/").filter(Boolean)
  const lastPart = pathParts[pathParts.length - 1]

  if (!lastPart) {
    return `${method.toUpperCase()} endpoint`
  }

  if (method === "get") {
    if (path.includes("{")) return `Get ${lastPart.replace(/[{}]/g, "")}`
    return `Get ${lastPart}`
  }
  if (method === "post") {
    return `Create/Update ${lastPart}`
  }

  return `${method.toUpperCase()} ${lastPart}`
}

/**
 * Generate description from path and method
 */
function generateDescription(path: string, method: string): string {
  if (path.includes("/ai/alt")) return "Generate descriptive alt-text for images using AI"
  if (path.includes("/ai/tickets")) return "AI-powered ticket operations"
  if (path.includes("/images/optimise")) return "Optimize images using Cloudflare Images service"
  if (path.includes("/tokens/")) return "Token management operations"
  if (path.includes("/dashboard/")) return "Dashboard data operations"
  if (path.includes("/go/")) return "URL redirection service"
  if (path.includes("/ping")) return "System health and information"
  if (path.includes("/docs")) return "API documentation"

  return `${method.toUpperCase()} operation for ${path}`
}
