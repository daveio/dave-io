#!/bin/bash

# Build script for WASM compilation

echo "Building Go Reader (WASM)..."

# Set Go environment for WASM
export GOOS=js
export GOARCH=wasm
export CGO_ENABLED=0

# Build the WASM module
if go build -ldflags="-w -s" -o go-reader.wasm reader.go; then
  echo "✅ WASM build successful! Output: go-reader.wasm"
  echo "📦 WASM module ready for Cloudflare Worker integration"

  # Get the size of the WASM file
  size=$(du -h go-reader.wasm | cut -f1) || true
  echo "📊 WASM file size: ${size}"
else
  echo "❌ WASM build failed"
  exit 1
fi
