import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for ping endpoint (merged from health, ping, and worker)
 */
interface PingResponse {
  api_available: boolean
  cf_connecting_ip: string
  cf_country: string
  cf_datacenter: string
  cf_ipcountry: string
  cf_ray: string
  edge_functions: boolean
  environment: string
  preset: string
  runtime: string
  server_side_rendering: boolean
  status: "ok" | "error"
  timestamp: string
  user_agent: string
  version: string
  worker_limits: {
    cpu_time: string
    memory: string
    request_timeout: string
  }
}

/**
 * Enhanced ping response (includes auth and headers)
 */
interface EnhancedPingResponse {
  data: PingResponse
  auth: {
    supplied: boolean
    token?: {
      value: string
      valid: boolean
      payload?: {
        subject: string
        tokenId: string | null
        issuedAt: string
        expiresAt: string | null
      }
    }
  }
  headers: {
    count: number
    request: {
      method: string
      host: string
      path: string
      version: string
    }
    cloudflare: Record<string, string>
    forwarding: Record<string, string>
    other: Record<string, string>
  }
  success: true
  timestamp: string
}

/**
 * Adapter for ping operations
 * Public endpoint that provides comprehensive service information
 */
export class InternalAdapter extends BaseAdapter {
  /**
   * Ping the server and get comprehensive service information (public endpoint)
   * Includes system status, auth validation, and request headers
   * @returns Complete service status including health, runtime, worker info, auth, and headers
   */
  async ping(): Promise<ApiResponse<EnhancedPingResponse>> {
    return this.makeRequest("/api/ping")
  }
}
