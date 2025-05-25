/**
 * IP Address Utilities - Deduplicated Implementation
 *
 * Robust utilities for working with CIDR IP addresses using the ip-address library
 * with shared logic between IPv4 and IPv6 operations to eliminate code duplication.
 */

import { Address4, Address6 } from "ip-address"

/**
 * Generic interface for IP address operations that both Address4 and Address6 satisfy
 */
interface IP {
  startAddress(): { bigInt(): bigint; address: string }
  endAddress(): { bigInt(): bigint }
  isInSubnet(other: IP): boolean
  subnetMask: number
  address: string
}

/**
 * Type constructor for creating IP address instances
 */
type IPConstructor<T extends IP> = new (cidr: string) => T

/**
 * Generic CIDR merging function that works with both IPv4 and IPv6 addresses
 *
 * @param cidrs Array of CIDR strings to merge
 * @param Addr Constructor function for the IP address type (Address4 or Address6)
 * @returns Array of merged CIDR strings with overlaps eliminated and adjacent ranges consolidated
 */
function mergeCidrs<T extends IP>(cidrs: string[], Addr: IPConstructor<T>): string[] {
  if (cidrs.length === 0) {
    return []
  }

  try {
    // Filter out invalid CIDRs and parse them
    const valid: T[] = []
    for (const c of cidrs) {
      try {
        valid.push(new Addr(c))
      } catch {
        // Silently skip invalid CIDRs
      }
    }

    // Sort addresses by their network address for efficient merging
    valid.sort((a, b) => {
      const x = a.startAddress().bigInt()
      const y = b.startAddress().bigInt()
      return x < y ? -1 : x > y ? 1 : 0
    })

    const merged: T[] = []
    for (const current of valid) {
      if (!merged.length) {
        merged.push(current)
        continue
      }

      const last = merged[merged.length - 1]
      if (!last) { continue }

      // Check if current network overlaps with or is contained in the last one
      if (current.isInSubnet(last) || last.isInSubnet(current)) {
        // Overlapping - replace with the broader network
        const broader = current.subnetMask >= last.subnetMask ? last : current
        merged[merged.length - 1] = broader
        continue
      }

      // Check if they're adjacent (can be merged)
      try {
        const lastEnd = last.endAddress().bigInt()
        const currentStart = current.startAddress().bigInt()

        // If the end of last + 1 equals start of current, they're adjacent
        if (lastEnd + 1n === currentStart) {
          // Try to create a supernet that encompasses both
          const newMask = Math.min(last.subnetMask, current.subnetMask) - 1
          if (newMask >= 0) {
            try {
              const supernet = new Addr(`${last.startAddress().address}/${newMask}`)
              if (current.isInSubnet(supernet) && last.isInSubnet(supernet)) {
                merged[merged.length - 1] = supernet
                continue
              }
            } catch {
              // Supernet creation failed, keep them separate
            }
          }
        }
      } catch {
        // Address calculation failed, keep them separate
      }

      // Not adjacent or overlapping, add as separate network
      merged.push(current)
    }

    return merged.map((addr) => addr.address)
  } catch (error) {
    console.error("Error merging CIDRs:", error)
    // Return unique valid CIDRs as fallback
    return [
      ...new Set(
        cidrs.filter((cidr) => {
          try {
            new Addr(cidr)
            return true
          } catch {
            return false
          }
        })
      )
    ]
  }
}

/**
 * IPv4 utilities for CIDR operations
 */
export const ipv4 = {
  /**
   * Merge IPv4 CIDR ranges to eliminate overlaps and consolidate adjacent networks
   *
   * @param cidrs Array of IPv4 CIDR strings
   * @returns Array of merged IPv4 CIDR strings
   */
  cidrMerge: (cidrs: string[]) => mergeCidrs(cidrs, Address4)
}

/**
 * IPv6 utilities for CIDR operations
 */
export const ipv6 = {
  /**
   * Merge IPv6 CIDR ranges to eliminate overlaps and consolidate adjacent networks
   *
   * @param cidrs Array of IPv6 CIDR strings
   * @returns Array of merged IPv6 CIDR strings
   */
  cidrMerge: (cidrs: string[]) => mergeCidrs(cidrs, Address6)
}
