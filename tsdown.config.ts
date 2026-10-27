import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  clean: true,
  sourcemap: true,
  banner: { js: '"use client";' },
  exports: true,
})

