import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/auto.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  target: 'es2018',
  external: ['react'],
});
