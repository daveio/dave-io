// Export the main endpoint classes for use in the main application
export { AiAlt } from "./alt-get"
export { AiAltPost } from "./alt-post"

// Export base classes and utilities for potential future use
export { AiAltBase } from "./base"
export { ImageProcessor } from "./image-processing"

// Re-export constants that might be useful elsewhere
export {
  MAX_REQUESTS_PER_HOUR,
  RATE_LIMIT_WINDOW,
  MAX_IMAGE_SIZE_MB,
  VALID_IMAGE_EXTENSIONS,
  IMAGE_AI_MODEL
} from "./base"
