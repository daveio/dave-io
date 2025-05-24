# Authentication Framework

This document describes the authentication framework for the API.

## Overview

The API uses JSON Web Tokens (JWTs) for authentication. JWTs are stateless, which means the server doesn't need to store any session information. All the necessary information is contained within the token itself.

## Features

- JWT-based authentication
- Support for scopes (permissions)
- Token expiration
- Accept tokens via Bearer header or POST data
- Middleware-based protection for endpoints
- CLI tool for generating tokens

## How It Works

1. A client obtains a JWT token (using the CLI tool or through an authentication endpoint)
2. The client includes this token in requests to protected endpoints:
   - As a Bearer token in the Authorization header: `Authorization: Bearer <token>`
   - Or as a `token` field in the request body for POST requests
3. The authentication middleware validates the token and checks if it has the required scopes
4. If the token is valid and has the necessary permissions, the request proceeds
5. If not, an error response is returned

## JWT Structure

The JWT payload contains the following fields:

- `sub`: Subject (user identifier)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp
- `jti`: JWT ID (unique identifier for this token)
- `iss`: Issuer (default: "api.dave.io")
- `aud`: Audience (default: "api.dave.io")
- `scopes`: Array of permission scopes granted to this token

## Using the Authentication Middleware

To protect an endpoint, use the `auth` middleware with the required scopes:

```typescript
import { auth } from "../lib/auth"

// Use the auth middleware with required scopes
middleware = [
  auth({ scopes: ["read:protected"] })
]
```

## CLI Tool

A CLI tool is provided to generate JWT tokens for testing and development:

```bash
# Run the JWT generator
bun jwt

# Or with command line arguments
bun jwt --subject user123 --scopes read:protected,write:data --expiresIn 1d
```

## Configuration

The JWT secret key is stored in Cloudflare Secrets as `JWT_SECRET`. This secret is used to sign and verify tokens.

## Best Practices

1. Use HTTPS for all API requests
2. Keep the JWT secret secure
3. Set appropriate token expiration times
4. Use specific scopes for fine-grained access control
5. Validate all token data before trusting it
6. Regularly rotate the JWT secret

## Example Protected Endpoint

```typescript
import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { auth } from "../lib/auth"
import { JwtPayload } from "../schemas"

export class Protected extends OpenAPIRoute {
  schema = {
    tags: ["Protected"],
    summary: "Protected endpoint requiring authentication",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Protected resource",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string" },
                user: { type: "string" },
                scopes: { 
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }

  // Use the auth middleware with required scopes
  middleware = [
    auth({ scopes: ["read:protected"] })
  ]

  async handle(c: Context) {
    // Get the JWT payload from the context
    const payload = c.get("jwtPayload") as JwtPayload
    
    return c.json({
      message: "This is a protected resource",
      user: payload.sub,
      scopes: payload.scopes
    })
  }
}
```

