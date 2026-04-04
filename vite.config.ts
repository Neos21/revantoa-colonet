import cloudflareAdapter from '@hono/vite-dev-server/cloudflare';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import serverAdapter from 'hono-react-router-adapter/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // Tailwind CSS を使用するプラグイン https://tailwindcss.com/docs/installation/framework-guides/react-router
    tailwindcss(),
    // React Router v7 を Vite で動作させるプラグイン
    reactRouter(),
    // Hono と React Router v7 を Vite 内で統合させるプラグイン
    serverAdapter({
      // `wrangler.jsonc` で指定した Bindings を取り込めるようにするアダプタ
      adapter: cloudflareAdapter,
      // Hono サーバのエントリポイント
      entry: './server/index.ts'
    })
  ],
  build: {
    rollupOptions: {
      // `build/client/assets/` 配下に出力されるファイル名を秘匿化する
      output: {
        entryFileNames: `assets/entry-[hash].js`,
        chunkFileNames: `assets/chunk-[hash].js`,
        assetFileNames: `assets/asset-[hash].[ext]`
      }
    }
  }
});
