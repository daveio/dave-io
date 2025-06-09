#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { symlink, readlink, unlink, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

/**
 * Fix Sharp libvips loading on macOS ARM64
 * Creates a symlink to the platform-specific libvips library
 */
async function fixSharp() {
  // Only run on macOS ARM64
  if (process.platform !== 'darwin' || process.arch !== 'arm64') {
    console.log('Sharp fix not needed (not macOS ARM64)');
    return;
  }

  const sourcePackagePath = resolve(
    'node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib'
  );

  // Check if source package exists (it's optional)
  if (!existsSync(sourcePackagePath)) {
    console.log('Sharp libvips package not installed (optional dependency)');
    return;
  }

  // Check if Sharp main package exists
  const sharpPath = resolve('node_modules/sharp');
  if (!existsSync(sharpPath)) {
    console.log('Sharp package not found');
    return;
  }

  // Create the necessary directory structure
  const targetDir = resolve(
    'node_modules/sharp/node_modules/@img/sharp-libvips-darwin-arm64/lib'
  );
  const targetPath = resolve(targetDir, 'libvips-cpp.8.16.1.dylib');

  // Ensure target directory exists
  try {
    await mkdir(dirname(targetPath), { recursive: true });
  } catch (error) {
    // Directory might already exist, that's okay
  }

  // Check if symlink already exists and is correct
  if (existsSync(targetPath)) {
    try {
      const linkTarget = await readlink(targetPath);
      const expectedTarget = '../../../../../@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib';
      if (linkTarget === expectedTarget) {
        console.log('Sharp libvips symlink already exists and is correct');
        return;
      } else {
        console.log('Removing incorrect symlink...');
        await unlink(targetPath);
      }
    } catch {
      // File exists but isn't a symlink, remove it
      console.log('Removing existing file to create symlink...');
      await unlink(targetPath);
    }
  }

  try {
    // Create relative symlink
    const relativePath = '../../../../../@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.16.1.dylib';
    await symlink(relativePath, targetPath);
    console.log('✅ Created Sharp libvips symlink for macOS ARM64');
  } catch (error) {
    console.warn('⚠️  Failed to create Sharp libvips symlink:', error);
    console.warn('You may need to run: brew install vips');
  }
}

if (import.meta.main) {
  await fixSharp();
}

export { fixSharp };
