import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for dashboard data endpoints
 */
interface DashboardDataResponse {
  name: string
  data: unknown
  timestamp: string
  cached?: boolean
  ttl?: number
}

/**
 * Response format for live dashboard updates
 */
interface LiveDashboardResponse {
  connections: number
  lastUpdate: string
  data: unknown
}

/**
 * Adapter for dashboard data operations (/api/dashboard/*)
 * Requires 'dashboard' scope or higher for authentication
 */
export class DashboardAdapter extends BaseAdapter {
  /**
   * Get dashboard data by name
   * @param name Dashboard name to retrieve (e.g., 'hacker-news')
   * @returns Dashboard data with caching information
   */
  async getDashboardData(name: string): Promise<ApiResponse<DashboardDataResponse>> {
    return this.makeRequest(`/api/dashboard/${name}`)
  }

  /**
   * Get live dashboard updates
   * @returns Live dashboard data with connection info
   */
  async getLiveDashboard(): Promise<ApiResponse<LiveDashboardResponse>> {
    return this.makeRequest("/api/dashboard/live")
  }
}
