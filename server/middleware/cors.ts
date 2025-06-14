const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://dave.io"
  // Add your production domains here
]

export default defineEventHandler(async (event) => {
  // Handle CORS for API routes
  if (event.node.req.url?.startsWith("/api/")) {
    const origin = getHeader(event, "origin")
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "") ? origin : "null"

    setHeaders(event, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-API-Key",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin"
    })

    // Handle preflight requests
    if (getMethod(event) === "OPTIONS") {
      setResponseStatus(event, 204)
      return ""
    }
  }
})
