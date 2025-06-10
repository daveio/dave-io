#!/usr/bin/env bun

import { $ } from 'bun'
import { existsSync } from 'fs'
import { join } from 'path'

const WASM_DIR = 'wasm/imageops'
const PKG_DIR = join(WASM_DIR, 'pkg')

interface BuildOptions {
  profile?: 'dev' | 'release'
  target?: string
  optimization?: 'size' | 'speed'
  clean?: boolean
  watch?: boolean
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...')
  
  try {
    await $`rustc --version`
    console.log('✅ Rust compiler found')
  } catch {
    console.error('❌ Rust not found. Install with: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh')
    process.exit(1)
  }

  try {
    await $`wasm-pack --version`
    console.log('✅ wasm-pack found')
  } catch {
    console.log('📦 Installing wasm-pack...')
    await $`cargo install wasm-pack`
  }

  if (!existsSync(join(WASM_DIR, 'Cargo.toml'))) {
    console.error(`❌ WASM project not found at ${WASM_DIR}`)
    process.exit(1)
  }
  
  console.log('✅ Prerequisites satisfied')
}

async function buildWasm(options: BuildOptions = {}) {
  const {
    profile = 'release',
    target = 'web',
    optimization = 'size',
    clean = false
  } = options

  console.log(`🚀 Building WASM module (${profile} profile, ${optimization} optimization)...`)

  if (clean && existsSync(PKG_DIR)) {
    console.log('🧹 Cleaning previous build...')
    await $`rm -rf ${PKG_DIR}`
  }

  const buildArgs = [
    'build',
    '--target', target,
    '--out-dir', 'pkg',
    '--out-name', 'imageops'
  ]

  if (profile === 'release') {
    buildArgs.push('--release')
  } else {
    buildArgs.push('--dev')
  }

  // Size optimization is handled in Cargo.toml

  try {
    const startTime = Date.now()
    await $`cd ${WASM_DIR} && wasm-pack ${buildArgs}`
    const buildTime = Date.now() - startTime
    
    console.log(`✅ Build completed in ${buildTime}ms`)
    
    // Show build stats
    const pkgJsonPath = join(PKG_DIR, 'package.json')
    const wasmPath = join(PKG_DIR, 'imageops_bg.wasm')
    
    if (existsSync(wasmPath)) {
      const stats = await Bun.file(wasmPath).stat()
      const sizeKB = Math.round(stats.size / 1024)
      console.log(`📦 WASM size: ${sizeKB}KB`)
    }
    
    if (existsSync(pkgJsonPath)) {
      const pkg = await Bun.file(pkgJsonPath).json()
      console.log(`📋 Package: ${pkg.name}@${pkg.version}`)
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function watchWasm() {
  console.log('👀 Watching for changes...')
  
  const watcher = new Bun.FileSystemWatcher(WASM_DIR)
  
  for await (const event of watcher) {
    if (event.path.endsWith('.rs') || event.path.endsWith('.toml')) {
      console.log(`🔄 Change detected: ${event.path}`)
      await buildWasm({ profile: 'dev' })
    }
  }
}

async function testWasm() {
  console.log('🧪 Testing WASM module...')
  
  if (!existsSync(PKG_DIR)) {
    console.error('❌ WASM package not found. Run build first.')
    process.exit(1)
  }
  
  try {
    // Basic import test
    const wasmModule = await import(`../${PKG_DIR}/imageops.js`)
    
    // Initialize WASM module
    await wasmModule.default()
    
    const info = wasmModule.get_wasm_info()
    const parsed = JSON.parse(info)
    
    console.log('✅ WASM module loads successfully')
    console.log(`📋 Module info:`, parsed)
    
    // Test processor
    const processor = new wasmModule.ImageProcessor()
    const runtimeInfo = processor.get_info()
    const parsedRuntime = JSON.parse(runtimeInfo)
    
    console.log('✅ ImageProcessor instantiates successfully') 
    console.log(`🎯 Runtime info:`, parsedRuntime)
    
  } catch (error) {
    console.error('❌ WASM test failed:', error)
    process.exit(1)
  }
}

async function clean() {
  console.log('🧹 Cleaning WASM build artifacts...')
  
  if (existsSync(PKG_DIR)) {
    await $`rm -rf ${PKG_DIR}`
    console.log('✅ Cleaned pkg directory')
  }
  
  const targetDir = join(WASM_DIR, 'target')
  if (existsSync(targetDir)) {
    await $`rm -rf ${targetDir}`
    console.log('✅ Cleaned target directory')
  }
  
  console.log('✅ Clean completed')
}

// CLI interface
const command = process.argv[2]
const flags = process.argv.slice(3)

const options: BuildOptions = {
  profile: flags.includes('--dev') ? 'dev' : 'release',
  optimization: flags.includes('--speed') ? 'speed' : 'size',
  clean: flags.includes('--clean'),
  watch: flags.includes('--watch')
}

switch (command) {
  case 'build':
    await checkPrerequisites()
    await buildWasm(options)
    if (options.watch) {
      await watchWasm()
    }
    break
    
  case 'test':
    await testWasm()
    break
    
  case 'clean':
    await clean()
    break
    
  case 'watch':
    await checkPrerequisites()
    await buildWasm({ ...options, profile: 'dev' })
    await watchWasm()
    break
    
  default:
    console.log(`
🦀 WASM Build Tool

Usage: bun wasm <command> [options]

Commands:
  build     Build the WASM module
  test      Test the built WASM module  
  clean     Clean build artifacts
  watch     Build and watch for changes

Options:
  --dev     Development build (faster compilation)
  --release Release build (default, optimized)
  --speed   Optimize for speed instead of size
  --size    Optimize for size (default)
  --clean   Clean before building
  --watch   Watch for changes after building

Examples:
  bun wasm build
  bun wasm build --dev --clean
  bun wasm test
  bun wasm watch
  bun wasm clean
`)
    process.exit(0)
}

export { buildWasm, testWasm, clean }