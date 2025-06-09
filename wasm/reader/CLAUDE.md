# Go Reader - AI Agent Context

## Project Overview

Go Reader is a WebAssembly-only web page readability proxy service written in Go. It extracts clean, readable content from web pages and is designed exclusively for Cloudflare Worker deployment via WASM compilation.

## Architecture Summary

### WASM-Only Structure
- `reader.go` - Complete WASM implementation with all functionality
- Single-file architecture for optimal WASM deployment
- No HTTP server or native binary support
- Integrated content processing, theming, and WASM interface

### Core Functionality
All functionality consolidated into `reader.go`:
- HTTP client with timeout and redirect handling
- HTML parsing and content extraction using goquery
- Metadata extraction from multiple sources
- Inline HTML template generation with Catppuccin Mocha theme
- WASM JavaScript interface via `processReaderWASM` function

### Content Processing Pipeline
1. URL validation and HTTP request with comprehensive headers
2. Character encoding detection and UTF-8 cleanup
3. HTML parsing and unwanted element removal
4. Semantic content extraction using multiple selectors
5. Metadata extraction (title, author, date, description)
6. Responsive HTML generation with embedded CSS

## Key Technical Details

### WASM Interface
- Exports single function: `processReader(url: string) => {html?: string, error?: string}`
- JavaScript-callable via `js.Global().Set("processReader", js.FuncOf(processReaderWASM))`
- Returns either processed HTML or error message
- Optimized for Cloudflare Worker integration

### HTTP Client Configuration
- 30-second timeout with configurable redirect handling
- Modern browser User-Agent and comprehensive headers
- Automatic decompression and content-length validation
- Maximum 10MB content size limit

### Character Encoding
- UTF-8 validation using `unicode/utf8.Valid()`
- Invalid sequence cleanup with `strings.ToValidUTF8()`
- Handles international content and special characters

### Content Extraction Strategy
- Smart content detection using semantic selectors (article, main, [role='main'])
- Fallback to body content with noise removal
- Removes ads, navigation, social widgets, and tracking elements
- Preserves text formatting and semantic structure

### Metadata Extraction Sources
- **Title**: og:title, twitter:title, h1, title tag
- **Author**: meta[name='author'], article:author, .author, .byline
- **Date**: article:published_time, meta[name='date'], time[datetime]
- **Description**: og:description, meta[name='description'], twitter:description

## Build Process

### WASM Compilation
```bash
GOOS=js GOARCH=wasm go build -ldflags="-w -s" -o go-reader.wasm reader.go
```

Build optimizations:
- `-w`: Strip debug information
- `-s`: Strip symbol table
- Produces ~2MB optimized WASM file

### Build Script
`build-wasm.sh` automates the build process with proper environment variables and optimization flags.

## Dependencies

- `github.com/PuerkitoBio/goquery` - HTML parsing and DOM manipulation
- `github.com/catppuccin/go` - Color scheme definitions for theming
- `syscall/js` - WebAssembly JavaScript interface (Go standard library)

## Catppuccin Mocha Theme

Integrated CSS with Catppuccin Mocha color palette:
- **Background**: `rgb(30, 30, 46)` (base)
- **Text**: `rgb(205, 214, 244)` (text)
- **Links**: `rgb(137, 180, 250)` (blue)
- **Headings**: `rgb(180, 190, 254)` (lavender)
- **Code**: `rgb(166, 227, 161)` (green)

Typography:
- **Body**: Ysabeau Infant (300 weight, 1.7 line-height)
- **Monospace**: Victor Mono
- **Responsive**: Mobile-optimized with fluid typography

## Integration Context

### Cloudflare Worker Deployment
- Single WASM file deployment model
- No external dependencies or template files
- Compatible with Nuxt.js 3 applications
- Integrates with existing authentication and metrics systems

### Performance Characteristics
- **Memory**: 10MB content limit prevents memory issues
- **Timeout**: 30-second processing limit for responsive UX
- **Size**: Optimized WASM binary ~2MB
- **Caching**: Edge-cacheable processed content

## Development Context

### Current Status
- **Complete**: All functionality consolidated into single WASM module
- **Optimized**: Build process produces minimal WASM file
- **Production-ready**: Comprehensive error handling and validation
- **Tested**: Works with diverse website types and character encodings

### Recent Consolidation
- Removed HTTP server components (main.go, config.go)
- Eliminated external template system (templates.go, template_manager.go)
- Consolidated all functionality into reader.go for WASM deployment
- Updated build scripts for WASM-only compilation

### Testing Strategy
Test WASM module with:
- News articles with complex layouts
- Academic content with mathematical notation
- International sites with various character encodings
- Social media and modern web applications

## Error Handling

Comprehensive error management:
- HTTP client errors (timeouts, network issues)
- Content parsing errors (invalid HTML, encoding issues)
- Size limit violations (oversized content)
- JavaScript-compatible error responses

## Performance Considerations

### WASM Optimization
- Minimal external dependencies
- Inline template generation
- Efficient string processing
- Memory-conscious content handling

### Cloudflare Worker Compatibility
- No file system dependencies
- Stateless processing model
- Edge-cacheable outputs
- Sub-second processing times

## Integration Patterns

### Nuxt.js Integration
```typescript
// server/api/reader/[...path].get.ts
const wasmModule = await getWASMModule();
const result = wasmModule.processReader(url);
```

### Direct WASM Usage
```javascript
const wasmInstance = await WebAssembly.instantiateStreaming(fetch('/go-reader.wasm'));
const result = wasmInstance.exports.processReader(url);
```

## Current Architecture Benefits

1. **Simplified Deployment**: Single WASM file with no external dependencies
2. **Edge Performance**: Optimized for Cloudflare Worker execution
3. **Maintenance**: Single-file codebase easier to maintain and update
4. **Integration**: Clean JavaScript interface for web applications
5. **Portability**: WASM runs consistently across different environments
