import { z } from "zod";
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error: string;
    code?: string | undefined;
    timestamp?: string | undefined;
}, {
    error: string;
    code?: string | undefined;
    timestamp?: string | undefined;
}>;
export declare const SuccessResponseSchema: z.ZodObject<{
    message: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    message: string;
}, {
    timestamp: string;
    message: string;
}>;
export declare const SlugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const UuidParamSchema: z.ZodObject<{
    uuid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uuid: string;
}, {
    uuid: string;
}>;
export declare const FormatQuerySchema: z.ZodObject<{
    format: z.ZodOptional<z.ZodEnum<["json", "yaml", "prometheus"]>>;
}, "strip", z.ZodTypeAny, {
    format?: "json" | "yaml" | "prometheus" | undefined;
}, {
    format?: "json" | "yaml" | "prometheus" | undefined;
}>;
export declare const RateLimitSchema: z.ZodObject<{
    remaining: z.ZodNumber;
    reset: z.ZodString;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    limit: number;
    remaining: number;
    reset: string;
}, {
    limit: number;
    remaining: number;
    reset: string;
}>;
export declare const JWTDetailsSchema: z.ZodObject<{
    subject: z.ZodString;
    subjectParts: z.ZodArray<z.ZodString, "many">;
    issuedAt: z.ZodNumber;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    timeToExpiry: z.ZodOptional<z.ZodNumber>;
    isExpired: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    subject: string;
    subjectParts: string[];
    issuedAt: number;
    isExpired: boolean;
    expiresAt?: number | undefined;
    timeToExpiry?: number | undefined;
}, {
    subject: string;
    subjectParts: string[];
    issuedAt: number;
    isExpired: boolean;
    expiresAt?: number | undefined;
    timeToExpiry?: number | undefined;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const StatusCodeMetricsSchema: z.ZodObject<{
    count: z.ZodNumber;
    lastSeen: z.ZodString;
}, "strip", z.ZodTypeAny, {
    count: number;
    lastSeen: string;
}, {
    count: number;
    lastSeen: string;
}>;
export declare const RouterOSMetricsSchema: z.ZodObject<{
    cacheHits: z.ZodNumber;
    cacheMisses: z.ZodNumber;
    cacheResets: z.ZodNumber;
    lastAccessed: z.ZodString;
    lastRefresh: z.ZodString;
    refreshCount: z.ZodNumber;
    lastReset: z.ZodString;
    resetCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    cacheHits: number;
    cacheMisses: number;
    cacheResets: number;
    lastAccessed: string;
    lastRefresh: string;
    refreshCount: number;
    lastReset: string;
    resetCount: number;
}, {
    cacheHits: number;
    cacheMisses: number;
    cacheResets: number;
    lastAccessed: string;
    lastRefresh: string;
    refreshCount: number;
    lastReset: string;
    resetCount: number;
}>;
export declare const CommonHeaders: {
    authorization: z.ZodOptional<z.ZodString>;
    "content-type": z.ZodOptional<z.ZodString>;
};
