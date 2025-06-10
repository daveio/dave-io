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

}
