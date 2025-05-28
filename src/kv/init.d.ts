/**
 * Initialize KV stores with default values if they don't exist
 */
export declare function initializeKV(env: {
    DATA: KVNamespace;
    ANALYTICS?: AnalyticsEngineDataset;
}): Promise<void>;
