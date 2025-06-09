# Go Reader

A Go-based web page readability proxy with Catppuccin Mocha theming that extracts clean, readable content from web pages. Designed exclusively for WebAssembly deployment in Cloudflare Workers.

## Features

- **Clean Content Extraction**: Removes ads, navigation, and clutter to present readable content
- **Beautiful Theming**: Catppuccin Mocha dark theme with Ysabeau Infant and Victor Mono typography
- **Metadata Extraction**: Extracts titles, authors, publish dates, and descriptions
- **WebAssembly Only**: Optimized for WASM compilation and Cloudflare Worker deployment
- **UTF-8 Handling**: Robust character encoding detection and cleanup
- **Production Ready**: Comprehensive error handling and timeout management

## Quick Start

### WebAssembly Build

```bash
# Clone and setup
git clone <repository-url>
cd go-reader
go mod tidy

# Build WASM module
./build-wasm.sh
```

This generates `go-reader.wasm` ready for Cloudflare Worker integration.

## Architecture

### WASM-Only Design

The project is structured as a single-file WASM module (`reader.go`) containing:

- **Content Processing**: HTTP client with timeout and redirect handling
- **HTML Parsing**: goquery-based content extraction and cleaning
- **Metadata Extraction**: Multi-source title, author, date, and description parsing
- **Template Generation**: Inline HTML generation with Catppuccin Mocha theming
- **WASM Interface**: JavaScript-callable `processReader` function

### Content Processing Pipeline

1. URL validation and HTTP request with proper headers
2. Character encoding detection and UTF-8 cleanup
3. HTML parsing and unwanted element removal
4. Content extraction using semantic selectors
5. Metadata extraction from multiple sources
6. Responsive HTML generation with embedded CSS

### WASM Integration

The module exports a single function:

```javascript
// WASM function signature
processReader(url: string) => {
  html?: string,
  error?: string
}
```

## Dependencies

- **github.com/PuerkitoBio/goquery** - HTML parsing and manipulation
- **github.com/catppuccin/go** - Color scheme definitions

## Deployment

### Cloudflare Workers

See `INTEGRATION.md` for detailed integration guide with Nuxt.js applications.

The WASM module integrates seamlessly with:
- Nuxt.js 3 applications
- Cloudflare Worker runtime
- Edge caching and performance optimization
- Existing authentication and metrics systems

### Build Process

```bash
# Production build with optimization
GOOS=js GOARCH=wasm go build -ldflags="-w -s" -o go-reader.wasm reader.go
```

Build flags:
- `-w`: Strip debug information
- `-s`: Strip symbol table
- WASM-optimized for minimal file size

## Project Structure

```text
go-reader/
├── reader.go           # Complete WASM implementation
├── build-wasm.sh       # WASM build script
├── wasm-wrapper.js     # JavaScript WASM loader
├── go.mod              # Go dependencies
├── INTEGRATION.md      # Cloudflare integration guide
├── README.md           # This file
├── CLAUDE.md           # AI agent documentation
└── .gitignore          # Git exclusions
```

## Development

### Testing the WASM Module

```bash
# Build the module
./build-wasm.sh

# Test with Node.js (requires wasm_exec.js from Go installation)
node wasm-wrapper.js
```

### Content Extraction Features

- **Smart Content Detection**: Uses semantic HTML selectors to find main content
- **Metadata Extraction**: Supports Open Graph, Twitter Cards, and Schema.org
- **Content Cleaning**: Removes ads, navigation, social widgets, and other noise
- **Character Encoding**: Handles international content with UTF-8 validation

### Theme Customization

The Catppuccin Mocha theme can be customized by modifying the `generateReadablePage` function:

```go
// Update color variables in the CSS template
--base: rgb(30, 30, 46);     // Background
--text: rgb(205, 214, 244);  // Primary text
--blue: rgb(137, 180, 250);  // Links
// ... other colors
```

## Integration Examples

### Basic WASM Loading

```javascript
// Load and instantiate WASM module
const wasmModule = await WebAssembly.instantiateStreaming(
  fetch('/go-reader.wasm')
);

// Process a URL
const result = wasmModule.instance.exports.processReader('https://example.com');
if (result.error) {
  console.error('Processing failed:', result.error);
} else {
  document.body.innerHTML = result.html;
}
```

### Cloudflare Worker Integration

```typescript
// server/api/reader/[...path].get.ts
export default defineEventHandler(async (event) => {
  const url = getRouterParam(event, 'path');
  const wasmModule = await getWASMModule(); // Cached module
  const result = await wasmModule.processReader(url);

  if (result.error) {
    throw createError({ statusCode: 500, statusMessage: result.error });
  }

  return result.html;
});
```

## Performance Considerations

- **WASM Module Size**: Optimized build produces ~2MB WASM file
- **Memory Usage**: Configurable content size limits (default 10MB)
- **Request Timeouts**: 30-second default with configurable limits
- **Edge Caching**: Compatible with Cloudflare's caching strategies

## Troubleshooting

### Build Issues

1. **WASM build fails**: Ensure Go 1.19+ with WebAssembly support
2. **Module too large**: Use build flags `-ldflags="-w -s"` for optimization
3. **Import errors**: Verify all dependencies are compatible with WASM target

### Runtime Issues

1. **Character encoding**: UTF-8 validation handles most international content
2. **Request timeouts**: Adjust timeout values for slow websites
3. **Content extraction**: Module uses multiple fallback selectors for content detection

## Contributing

1. Maintain WASM compatibility for all changes
2. Test with diverse website types and character encodings
3. Follow Go formatting conventions (`go fmt`)
4. Update documentation for new features

## License

[Add your license information here]
