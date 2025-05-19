/**
 * IP Address Utilities
 *
 * Simple utilities for working with CIDR IP addresses
 */

// Helper function to check if a string is a valid IPv4 CIDR
function isValidIpv4Cidr(cidr: string): boolean {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  if (!pattern.test(cidr)) return false

  const [ip, prefix] = cidr.split("/")
  const parts = ip.split(".")

  // Check if each part is valid (0-255)
  for (const part of parts) {
    const num = Number.parseInt(part, 10)
    if (Number.isNaN(num) || num < 0 || num > 255) return false
  }

  // Check if prefix is valid (0-32)
  const prefixNum = Number.parseInt(prefix, 10)
  return !Number.isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32
}

// Helper function to check if a string is a valid IPv6 CIDR
function isValidIpv6Cidr(cidr: string): boolean {
  // Simple validation - better validation would include more complex IPv6 format rules
  const parts = cidr.split("/")
  if (parts.length !== 2) return false

  // Check if the prefix is valid (0-128)
  const prefix = Number.parseInt(parts[1], 10)
  if (Number.isNaN(prefix) || prefix < 0 || prefix > 128) return false

  // Check if the IP part has a colon (simple IPv6 check)
  return parts[0].includes(":")
}

/**
 * IPv4 utilities for CIDR operations
 */
export const ipv4 = {
  /**
   * Merge IPv4 CIDR ranges to eliminate overlaps and consolidate adjacent networks
   *
   * Note: This is a simplified implementation that simply ensures uniqueness
   * A proper implementation would merge overlapping CIDRs, but that requires more complex logic
   *
   * @param cidrs Array of IPv4 CIDR strings
   * @returns Array of merged IPv4 CIDR strings
   */
  cidrMerge(cidrs: string[]): string[] {
    // Filter for valid IPv4 CIDRs
    const validCidrs = cidrs.filter(isValidIpv4Cidr)

    // For now, just deduplicate
    return [...new Set(validCidrs)]
  }
}

/**
 * IPv6 utilities for CIDR operations
 */
export const ipv6 = {
  /**
   * Merge IPv6 CIDR ranges to eliminate overlaps and consolidate adjacent networks
   *
   * Note: This is a simplified implementation that simply ensures uniqueness
   * A proper implementation would merge overlapping CIDRs, but that requires more complex logic
   *
   * @param cidrs Array of IPv6 CIDR strings
   * @returns Array of merged IPv6 CIDR strings
   */
  cidrMerge(cidrs: string[]): string[] {
    // Filter for valid IPv6 CIDRs
    const validCidrs = cidrs.filter(isValidIpv6Cidr)

    // For now, just deduplicate
    return [...new Set(validCidrs)]
  }
}
