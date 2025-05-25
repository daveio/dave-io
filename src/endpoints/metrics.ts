import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { dump as yamlDump } from "js-yaml"
import { GROUP_PREFIX, METRICS_PREFIX, STATUS_PREFIX } from "../kv/metrics"

export class Metrics extends OpenAPIRoute {
  /**
   * Get all metrics data from KV
   */
  private async getMetricsData(env: { DATA: KVNamespace }): Promise<Record<string, number>> {
    const result: Record<string, number> = {}

    try {
      // List all KV entries with the metrics prefix
      const kvList = await env.DATA.list({ prefix: METRICS_PREFIX })

      // Process each key to get the metric value
      for (const key of kvList.keys) {
        const value = await env.DATA.get(key.name)
        if (value) {
          const numValue = Number.parseInt(value, 10)
          if (!Number.isNaN(numValue)) {
            result[key.name] = numValue
          }
        }
      }
    } catch (error) {
      console.error("Error retrieving metrics data:", error)
    }

    return result
  }

  /**
   * Format metrics data as Prometheus format
   */
  private formatPrometheusMetrics(metrics: Record<string, number>): string {
    const lines: string[] = []

    // Add timestamp
    const timestamp = Date.now()

    // Process each metric
    for (const [key, value] of Object.entries(metrics)) {
      // Format the metric name according to Prometheus conventions
      let metricName = key.replace(METRICS_PREFIX, "")
      metricName = metricName.replace(/:/g, "_")

      // Special handling for status codes
      if (key.startsWith(STATUS_PREFIX)) {
        const statusCode = key.replace(STATUS_PREFIX, "")
        // Add a TYPE and HELP line if this is the first status code
        if (!lines.some((line) => line.startsWith("# HELP http_status_code"))) {
          lines.push("# HELP http_status_code Number of HTTP requests by status code")
          lines.push("# TYPE http_status_code counter")
        }
        lines.push(`http_status_code{code="${statusCode}"} ${value} ${timestamp}`)
      }
      // Special handling for status groups
      else if (key.startsWith(GROUP_PREFIX)) {
        const groupCode = key.replace(GROUP_PREFIX, "")
        // Add a TYPE and HELP line if this is the first status group
        if (!lines.some((line) => line.startsWith("# HELP http_status_group"))) {
          lines.push("# HELP http_status_group Number of HTTP requests by status group")
          lines.push("# TYPE http_status_group counter")
        }
        lines.push(`http_status_group{group="${groupCode}"} ${value} ${timestamp}`)
      }
      // General metrics
      else {
        // Add a TYPE and HELP line for this metric
        lines.push(`# HELP ${metricName} Metric for ${metricName}`)
        lines.push(`# TYPE ${metricName} counter`)
        lines.push(`${metricName} ${value} ${timestamp}`)
      }
    }

    return lines.join("\n")
  }

  /**
   * Process the metrics request
   */
  async handle(c: Context<{ Bindings: { DATA: KVNamespace } }>): Promise<Response> {
    const metricsData = await this.getMetricsData(c.env)

    // Check the format requested from the URL path
    const { path } = c.req

    if (path.endsWith("/json")) {
      // Return JSON format
      return c.json(metricsData)
    }

    if (path.endsWith("/yaml")) {
      // Return YAML format
      const yamlContent = yamlDump(metricsData, { indent: 2 })
      return new Response(yamlContent, {
        headers: {
          "Content-Type": "text/yaml"
        }
      })
    }

    if (path.endsWith("/prometheus")) {
      // Return Prometheus format
      const prometheusContent = this.formatPrometheusMetrics(metricsData)
      return new Response(prometheusContent, {
        headers: {
          "Content-Type": "text/plain"
        }
      })
    }

    // Default to JSON
    return c.json(metricsData)
  }
}
