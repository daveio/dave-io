import { XMLParser } from "fast-xml-parser"
import type { H3Event } from "h3"
import { createApiError } from "./response"

interface RSSItem {
  title?: string
  link?: string
  description?: string
  pubDate?: string
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
      throw createApiError(400, "Invalid RSS format - no channel found")
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
