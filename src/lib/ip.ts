/**
 * IP Address Utilities
 *
 * Robust utilities for working with CIDR IP addresses using the ip-address library
 */

import { Address4, Address6 } from "ip-address"

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
  cidrMerge(cidrs: string[]): string[] {
    if (cidrs.length === 0) {
      return []
    }

    try {
      // Filter out invalid CIDRs and parse them
      const validAddresses: Address4[] = []

      for (const cidr of cidrs) {
        try {
          const addr = new Address4(cidr)
          // Address4 constructor throws if invalid, so if we get here it's valid
          validAddresses.push(addr)
        } catch {}
      }

      // Sort addresses by their network address for efficient merging
      validAddresses.sort((a, b) => {
        const aStart = a.startAddress().bigInt()
        const bStart = b.startAddress().bigInt()
        return aStart < bStart ? -1 : aStart > bStart ? 1 : 0
      })

      const merged: Address4[] = []

      for (const current of validAddresses) {
        if (merged.length === 0) {
          merged.push(current)
          continue
        }

        const last = merged[merged.length - 1]

        // Check if current network overlaps with or is contained in the last one
        if (current.isInSubnet(last) || last.isInSubnet(current)) {
          // Overlapping - replace with the broader network
          const broader = current.subnetMask >= last.subnetMask ? last : current
          merged[merged.length - 1] = broader
        } else {
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
                  const supernet = new Address4(`${last.startAddress().address}/${newMask}`)
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
      }

      return merged.map((addr) => addr.address)
    } catch (error) {
      console.error("Error merging IPv4 CIDRs:", error)
      // Return unique valid CIDRs as fallback
      return [
        ...new Set(
          cidrs.filter((cidr) => {
            try {
              new Address4(cidr)
              return true
            } catch {
              return false
            }
          })
        )
      ]
    }
  }
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
  cidrMerge(cidrs: string[]): string[] {
    if (cidrs.length === 0) {
      return []
    }

    try {
      // Filter out invalid CIDRs and parse them
      const validAddresses: Address6[] = []

      for (const cidr of cidrs) {
        try {
          const addr = new Address6(cidr)
          // Address6 constructor throws if invalid, so if we get here it's valid
          validAddresses.push(addr)
        } catch {}
      }

      // Sort addresses by their network address
      validAddresses.sort((a, b) => {
        const aStart = a.startAddress().bigInt()
        const bStart = b.startAddress().bigInt()
        return aStart < bStart ? -1 : aStart > bStart ? 1 : 0
      })

      const merged: Address6[] = []

      for (const current of validAddresses) {
        if (merged.length === 0) {
          merged.push(current)
          continue
        }

        const last = merged[merged.length - 1]

        // Check if current network overlaps with or is contained in the last one
        if (current.isInSubnet(last) || last.isInSubnet(current)) {
          // Overlapping - replace with the broader network
          const broader = current.subnetMask >= last.subnetMask ? last : current
          merged[merged.length - 1] = broader
        } else {
          // Check if they're adjacent (IPv6 adjacency is more complex)
          try {
            const lastEnd = last.endAddress().bigInt()
            const currentStart = current.startAddress().bigInt()

            // If the end of last + 1 equals start of current, they're adjacent
            if (lastEnd + 1n === currentStart) {
              // Try to create a supernet that encompasses both
              const newMask = Math.min(last.subnetMask, current.subnetMask) - 1
              if (newMask >= 0) {
                try {
                  const supernet = new Address6(`${last.startAddress().address}/${newMask}`)
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
      }

      return merged.map((addr) => addr.address)
    } catch (error) {
      console.error("Error merging IPv6 CIDRs:", error)
      // Return unique valid CIDRs as fallback
      return [
        ...new Set(
          cidrs.filter((cidr) => {
            try {
              new Address6(cidr)
              return true
            } catch {
              return false
            }
          })
        )
      ]
    }
  }
}
