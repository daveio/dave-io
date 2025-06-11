import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for ping endpoint (new restructured format)
 */
interface PingResponse {
  cloudflare: {
    connectingIP: string
    country: {
      ip: string
      primary: string
    }
    datacentre: string
    ray: string
    request: {
      agent: string
      host: string
      method: string
      path: string
      proto: {
        forward: string
        request: string
      }
      version: string
    }
  }
  worker: {
    edge_functions: boolean
    environment: string
    limits: {
      cpu_time: string
      memory: string
      request_timeout: string
    }
    preset: string
    runtime: string
    server_side_rendering: boolean
    version: string
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
    cloudflare: Record<string, string>
    forwarding: Record<string, string>
    other: Record<string, string>
  }
  ok: true
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
  async ping(): Promise<ApiResponse & EnhancedPingResponse> {
    return this.makeRequest("/api/ping") as Promise<ApiResponse & EnhancedPingResponse>
  }
}
