import { Str } from "chanfana"
import { z } from "zod"

export const RedirectType = z.object({
  slug: Str({ example: "hello" }),
  url: Str({ example: "https://dave.io" })
})

/**
 * Type definitions for Cloudflare Workers
 */

// Extend the existing Bindings interface, if it already exists
declare global {
  // KV Namespace
  interface KVNamespace {
    get(key: string, options?: Partial<KVNamespaceGetOptions<unknown>>): Promise<string | null>
    get<ExpectedValue = unknown>(
      key: string,
      options: KVNamespaceGetOptions<ExpectedValue>
    ): Promise<ExpectedValue | null>
    put(
      key: string,
      value: string | ReadableStream | ArrayBuffer | FormData,
      options?: KVNamespacePutOptions
    ): Promise<void>
    delete(key: string): Promise<void>
    list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>>
  }

  interface KVNamespaceGetOptions<_ExpectedValue> {
    type: "text" | "json" | "arrayBuffer" | "stream"
    cacheTtl?: number
  }

  interface KVNamespacePutOptions {
    expiration?: number
    expirationTtl?: number
    metadata?: Record<string, unknown>
  }

  interface KVNamespaceListOptions {
    limit?: number
    prefix?: string
    cursor?: string
  }

  interface KVNamespaceListResult<Type> {
    keys: {
      name: string
      expiration?: number
      metadata?: Type
    }[]
    list_complete: boolean
    cursor?: string
  }

  // Analytics Engine
  interface AnalyticsEngineDataset {
    writeDataPoint(data: AnalyticsEngineDataPoint): void
  }

  interface AnalyticsEngineDataPoint {
    indexes: string[]
    blobs?: string[]
    doubles?: number[]
  }

  // Durable Objects
  interface DurableObjectState {
    storage: DurableObjectStorage
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>
  }

  interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>
    get<T>(keys: string[]): Promise<Map<string, T>>
    put<T>(key: string, value: T): Promise<void>
    put<T>(entries: Record<string, T>): Promise<void>
    delete(key: string): Promise<boolean>
    delete(keys: string[]): Promise<number>
    list<T>(options?: DurableObjectStorageListOptions): Promise<Map<string, T>>
    deleteAll(): Promise<void>
    transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T>
  }

  interface DurableObjectStorageListOptions {
    start?: string
    end?: string
    prefix?: string
    reverse?: boolean
    limit?: number
  }

  interface DurableObjectTransaction {
    get<T>(key: string): Promise<T | undefined>
    get<T>(keys: string[]): Promise<Map<string, T>>
    put<T>(key: string, value: T): Promise<void>
    put<T>(entries: Record<string, T>): Promise<void>
    delete(key: string): Promise<boolean>
    delete(keys: string[]): Promise<number>
    list<T>(options?: DurableObjectStorageListOptions): Promise<Map<string, T>>
    rollback(): void
  }

  interface DurableObjectNamespace {
    newUniqueId(options?: { jurisdiction?: string }): DurableObjectId
    idFromName(name: string): DurableObjectId
    idFromString(id: string): DurableObjectId
    get(id: DurableObjectId): DurableObject
  }

  interface DurableObjectId {
    toString(): string
    equals(other: DurableObjectId): boolean
    name?: string
  }

  interface DurableObject {
    fetch(request: Request): Promise<Response>
  }
}
