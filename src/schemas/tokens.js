import { z } from "zod";
import { ErrorResponseSchema, UuidParamSchema } from "./common";
export const TokenUsageResponseSchema = z.object({
    uuid: z.string().uuid().describe("Token UUID"),
    requestCount: z.number().int().min(0).describe("Number of requests made with this token"),
    lastUsed: z.string().optional().describe("ISO timestamp of last usage"),
    isRevoked: z.boolean().describe("Whether the token is revoked")
});
export const TokenRevokeRequestSchema = z.object({
    revoked: z.boolean().describe("Whether to revoke (true) or unrevoke (false) the token")
});
export const TokenRevokeResponseSchema = z.object({
    uuid: z.string().uuid().describe("Token UUID"),
    revoked: z.boolean().describe("New revocation status"),
    message: z.string().describe("Confirmation message")
});
export const TokenUsageRouteSchema = {
    tags: ["Token Management"],
    summary: "Get token usage information",
    description: "Retrieves usage statistics for a specific JWT token by UUID. Requires 'tokens:read' permission.",
    security: [{ bearerAuth: [] }],
    request: {
        params: UuidParamSchema
    },
    responses: {
        200: {
            description: "Token usage information retrieved successfully",
            content: {
                "application/json": {
                    schema: TokenUsageResponseSchema
                }
            }
        },
        401: {
            description: "Authentication required",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: "Insufficient permissions - requires 'tokens:read'",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: "Token not found",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
export const TokenRevokeRouteSchema = {
    tags: ["Token Management"],
    summary: "Revoke or unrevoke a token",
    description: "Revokes or unrevokes a JWT token by UUID. Requires 'tokens:write' permission.",
    security: [{ bearerAuth: [] }],
    request: {
        params: UuidParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: TokenRevokeRequestSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: "Token revocation status updated successfully",
            content: {
                "application/json": {
                    schema: TokenRevokeResponseSchema
                }
            }
        },
        400: {
            description: "Invalid request body",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        401: {
            description: "Authentication required",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        403: {
            description: "Insufficient permissions - requires 'tokens:write'",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        404: {
            description: "Token not found",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
//# sourceMappingURL=tokens.js.map