import { XMLParser } from "fast-xml-parser"
import type { H3Event } from "h3"
import { dump as yamlDump } from "js-yaml"
import { createApiError } from "./response"

interface RSSItem {
  title?: string
  link?: string
  description?: string
  pubDate?: string
}

/**
 * Format metrics data as YAML using js-yaml library
 * Replaces manual string concatenation in metrics endpoint
 */
export function formatMetricsAsYAML(metrics: {
  success: boolean
  data: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    redirect_clicks: number
  }
  timestamp: string
}): string {
  return yamlDump(metrics, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  })
}

/**
 * Format metrics data as Prometheus exposition format
 * Centralizes the Prometheus format generation
 */
export function formatMetricsAsPrometheus(metrics: {
  data: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    redirect_clicks: number
  }
}): string {
  const lines: string[] = []

  // Total requests counter
  lines.push("# HELP api_requests_total Total number of API requests")
  lines.push("# TYPE api_requests_total counter")
  lines.push(`api_requests_total ${metrics.data.total_requests}`)
  lines.push("")

  // Successful requests counter
  lines.push("# HELP api_requests_successful_total Total number of successful API requests")
  lines.push("# TYPE api_requests_successful_total counter")
  lines.push(`api_requests_successful_total ${metrics.data.successful_requests}`)
  lines.push("")

  // Failed requests counter
  lines.push("# HELP api_requests_failed_total Total number of failed API requests")
  lines.push("# TYPE api_requests_failed_total counter")
  lines.push(`api_requests_failed_total ${metrics.data.failed_requests}`)
  lines.push("")

  // Redirect clicks counter
  lines.push("# HELP redirect_clicks_total Total number of redirect clicks")
  lines.push("# TYPE redirect_clicks_total counter")
  lines.push(`redirect_clicks_total ${metrics.data.redirect_clicks}`)

  return lines.join("\n")
}

/**
 * Response format handler - centralizes the format switching logic
 */
export function handleResponseFormat(
  event: H3Event,
  _data: unknown,
  supportedFormats: {
    json?: () => unknown
    yaml?: () => string
    prometheus?: () => string
    text?: () => string
  }
): unknown {
  const query = getQuery(event)
  const format = (query.format as string)?.toLowerCase() || "json"

  switch (format) {
    case "json":
      if (!supportedFormats.json) {
        throw createApiError(400, "JSON format not supported for this endpoint")
      }
      setHeader(event, "content-type", "application/json")
      return supportedFormats.json()

    case "yaml":
      if (!supportedFormats.yaml) {
        throw createApiError(400, "YAML format not supported for this endpoint")
      }
      setHeader(event, "content-type", "application/x-yaml")
      return supportedFormats.yaml()

    case "prometheus":
      if (!supportedFormats.prometheus) {
        throw createApiError(400, "Prometheus format not supported for this endpoint")
      }
      setHeader(event, "content-type", "text/plain")
      return supportedFormats.prometheus()

    case "text":
      if (!supportedFormats.text) {
        throw createApiError(400, "Text format not supported for this endpoint")
      }
      setHeader(event, "content-type", "text/plain")
      return supportedFormats.text()

    default: {
      const supported = Object.keys(supportedFormats).join(", ")
      throw createApiError(400, `Unsupported format: ${format}. Supported formats: ${supported}`)
    }
  }
}

/**
 * Parse RSS/XML content using fast-xml-parser
 * Replaces manual regex-based parsing in dashboard endpoint
 */
export function parseRSSFeed(xmlContent: string): Array<{
  title: string
  link: string
  description?: string
  pubDate?: string
}> {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    })

    const parsed = parser.parse(xmlContent)

    // Handle RSS 2.0 format
    const channel = parsed.rss?.channel
    if (!channel) {
      throw new Error("Invalid RSS format - no channel found")
    }

    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)

    return items.map((item: RSSItem) => ({
      title: item.title || "Untitled",
      link: item.link || "",
      description: item.description || undefined,
      pubDate: item.pubDate || undefined
    }))
  } catch (error) {
    console.error("RSS parsing error:", error)
    throw createApiError(500, "Failed to parse RSS feed")
  }
}
