import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for health check endpoint
 */
interface HealthResponse {
  status: "ok" | "degraded" | "down"
  timestamp: string
  version?: string
  uptime?: number
  checks?: Record<string, { status: string; message?: string }>
}

/**
 * Response format for auth validation endpoint
 */
interface AuthResponse {
  valid: boolean
  sub?: string
  exp?: number
  iat?: number
  jti?: string
  permissions?: string[]
}

/**
 * Response format for metrics endpoint
 */
interface MetricsResponse {
  metrics: Record<string, unknown>
  format: "json" | "yaml" | "prometheus"
  timestamp: string
  total?: number
}

/**
 * Response format for worker info endpoint
 */
interface WorkerResponse {
  runtime: string
  version?: string
  region?: string
  colo?: string
  cf?: Record<string, unknown>
}

/**
 * Response format for headers debug endpoint
 */
interface HeadersResponse {
  headers: Record<string, string>
  ip?: string
  userAgent?: string
  country?: string
  ray?: string
}

/**
 * Adapter for internal system operations (/api/internal/*)
 * Most endpoints are public except auth and metrics which require tokens
 */
export class InternalAdapter extends BaseAdapter {
  /**
   * Create a new internal adapter instance
   * @param config Configuration for the adapter
   */
  constructor(config: RequestConfig) {
    super(config)
  }

  /**
   * Check system health status (public endpoint)
   * @returns System health information
   */
  async health(): Promise<ApiResponse<HealthResponse>> {
    return this.makeRequest("/api/internal/health")
  }

  /**
   * Ping the server (public endpoint)
   * @returns Pong response with timestamp
   */
  async ping(): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    return this.makeRequest("/api/internal/ping")
  }

  /**
   * Get worker runtime information (public endpoint)
   * @returns Cloudflare Workers runtime details
   */
  async worker(): Promise<ApiResponse<WorkerResponse>> {
    return this.makeRequest("/api/internal/worker")
  }

  /**
   * Debug request headers (public endpoint)
   * @returns Request headers and client information
   */
  async headers(): Promise<ApiResponse<HeadersResponse>> {
    return this.makeRequest("/api/internal/headers")
  }

  /**
   * Validate JWT token (requires any valid token)
   * @returns Token validation result and decoded claims
   */
  async auth(): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest("/api/internal/auth")
  }

  /**
   * Get API metrics (requires 'api:metrics' scope or higher)
   * @param format Output format for metrics data
   * @returns API usage metrics in specified format
   */
  async metrics(format: "json" | "yaml" | "prometheus" = "json"): Promise<ApiResponse<MetricsResponse>> {
    return this.makeRequest("/api/internal/metrics", {
      params: { format }
    })
  }
}
