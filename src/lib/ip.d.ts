/**
 * IP Address Utilities - Deduplicated Implementation
 *
 * Robust utilities for working with CIDR IP addresses using the ip-address library
 * with shared logic between IPv4 and IPv6 operations to eliminate code duplication.
 */
/**
 * IPv4 utilities for CIDR operations
 */
export declare const ipv4: {
    /**
     * Merge IPv4 CIDR ranges to eliminate overlaps and consolidate adjacent networks
     *
     * @param cidrs Array of IPv4 CIDR strings
     * @returns Array of merged IPv4 CIDR strings
     */
    cidrMerge: (cidrs: string[]) => string[];
};
/**
 * IPv6 utilities for CIDR operations
 */
export declare const ipv6: {
    /**
     * Merge IPv6 CIDR ranges to eliminate overlaps and consolidate adjacent networks
     *
     * @param cidrs Array of IPv6 CIDR strings
     * @returns Array of merged IPv6 CIDR strings
     */
    cidrMerge: (cidrs: string[]) => string[];
};
