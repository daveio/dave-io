# Scratchpad

## Image Optimisation Service Specification

### Purpose

Create an API service that automatically resizes and compresses uploaded images to improve load times, with configurable quality and format options.

### Available Resources

* **Dependencies** : `sharp` (already in `bun.lock`), `@noble/hashes` (for BLAKE3 hashing), `cloudflare` library
* **Storage** : R2 bucket named `images-dave-io` with path prefix `/opt/`
* **Language** : Use British spelling throughout (e.g., "optimise" not "optimize")

### API Endpoints

#### 1. Base Optimisation Endpoint

 **Path** : `/api/images/optimise` (implemented in `server/api/images/optimise.ts`)

 **Methods** :

* **GET** : Accepts image URL via `url` query parameter
* **POST** : Accepts base64-encoded image data in request body
* Must be raw base64, NOT a data URI (no `data:` prefix)
* Validate base64 format before decoding
* Return 406 Not Acceptable if invalid

#### 2. Preset Endpoint

 **Path** : `/api/images/optimise/preset/{preset}`

* Create preset `alt` that ensures output ≤ 4MB (as close to 4MB as possible)
* This preset will be used by the AI alt text endpoint

### Processing Logic

#### 1. Input Validation

* **MIME Type Detection** :
* Sniff actual MIME type (do NOT trust file extensions)
* Reject non-image files immediately with 406 Not Acceptable
* Must validate before any processing begins

#### 2. Image Transformation

* **Library** : Use `sharp` for all image processing
* **Output Format** : Always WebP
* **Transparency** : Must be preserved when present

#### 3. Compression Strategy

 **Parameters** :

* `quality`: integer 0-100 (optional)
* `lossy`: boolean (optional) - forces lossy compression

 **Logic** :

```
IF quality parameter is specified:
  → Output lossy WebP at specified quality
ELSE IF input is lossy format (e.g., JPEG):
  → Output lossy WebP at quality 60
ELSE IF input is lossless format (e.g., PNG):
  → Output lossless WebP (best compression)
```

### Storage Specification

#### Filename Format

`{UNIX_TIME}-{BLAKE3_HASH}.{EXTENSION}`

Where:

* `UNIX_TIME`: Current timestamp in seconds
* `BLAKE3_HASH`: Base64-encoded 128-bit BLAKE3 hash of the **original** input image
  * Use `@noble/hashes` with parameters: `{ dkLen: 128 }`
  * Hash the original image data, not the optimised version
* `EXTENSION`: Based on output format (always `.webp`)

#### Storage Location

* Bucket: `images-dave-io`
* Path prefix: `/opt/`
* Use `cloudflare` library or S3 compatibility layer
* Credentials can be stored in secrets

### Integration Requirements

1. **AI Alt Text Endpoint** :

* Update to call optimisation API before processing
* Use the `alt` preset to ensure images are ≤ 4MB

1. **Existing Upload Flows** :

* Update all current image upload processes to use this optimisation service

### Implementation Notes

* The service doesn't need to track URLs after returning them to callers
* No database storage required for optimised image metadata
* Filenames include timestamp to enable future cleanup operations
* Full WebP support (both lossy and lossless) must be implemented
* Consider using additional libraries if needed for complete WebP functionality
