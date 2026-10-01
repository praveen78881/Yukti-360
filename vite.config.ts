import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'url';
import { statSync } from 'node:fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localApiKeyFromEnv = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;

  return {
    plugins: [
    react(),
    // Dev-only: provide Netlify Functions endpoint locally.
    // This prevents `/.netlify/functions/gemini-plan` 404 when testing AI on localhost.
    {
      name: 'netlify-functions-dev-middleware',
      configureServer(devServer) {
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev) return;

        const endpointPath = '/.netlify/functions/gemini-plan';
        const localApiKey = localApiKeyFromEnv;

        devServer.middlewares.use(endpointPath, async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }

          if (!localApiKey) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: 'GEMINI_API_KEY/VITE_GEMINI_API_KEY missing for local dev' }));
            return;
          }

          let raw = '';
          req.on('data', chunk => { raw += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(raw || '{}');
              const { model = 'gemini-3-flash-preview', ...geminiPayload } = body ?? {};

              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                    'x-goog-api-key': localApiKey,
                  },
                  body: JSON.stringify(geminiPayload),
                },
              );

              const text = await response.text();
              
              res.statusCode = response.status;
              res.setHeader('content-type', 'application/json');
              res.end(text);
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ error: e?.message || 'Local Gemini proxy failed' }));
            }
          });
        });
      },
    },
    // Dev-only: mirror the Sandbox GST Netlify function on localhost so the
    // GSTR-2A/2B pages work at http://localhost:3000 without deploying. Uses the
    // SAME server-side core as netlify/functions/gst-sandbox.js, reading
    // SANDBOX_API_KEY/SECRET from the loaded env — never exposed to the browser.
    {
      name: 'sandbox-gst-dev-middleware',
      configureServer(devServer) {
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev) return;

        const corePath = path.resolve(__dirname, 'netlify/functions/_shared/sandboxCore.mjs');
        const coreUrl = pathToFileURL(corePath).href;

        devServer.middlewares.use('/.netlify/functions/gst-sandbox', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }
          let raw = '';
          req.on('data', (chunk) => { raw += chunk; });
          req.on('end', async () => {
            try {
              // Cache-bust by mtime so edits to sandboxCore.mjs are picked up in dev
              // without a manual restart (re-imports only when the file actually changes).
              const mtime = statSync(corePath).mtimeMs;
              const { getConfigFromEnv, handleAction } = await import(`${coreUrl}?t=${mtime}`);
              const { action, env: reqEnv, ...params } = JSON.parse(raw || '{}');
              const cfg = getConfigFromEnv(env, reqEnv);
              const { status, data } = await handleAction(action, params, cfg);
              res.statusCode = status;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (e: any) {
              res.statusCode = e?.statusCode || 500;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ error: e?.message || 'Sandbox proxy failed' }));
            }
          });
        });
      },
    },
    ],
    server: {
      port: 3000,
      strictPort: true,
      // Don't watch stray binary/data files dropped in the repo — they can be
      // locked by other apps (image viewers, OneDrive sync) and crash the dev
      // watcher with EBUSY. These aren't source, so hot-reload doesn't need them.
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/*.png',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.xml',
          '**/samples/**',
          // Raw ITR form source folders (large HTML, already deployed to /public) — not app
          // source. Matches itr25-26, itr26-27, … so the watcher never chokes on them.
          '**/itr??-??/**',
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'radix-ui': path.resolve(__dirname, './src/shims/radix-ui'),
      },
    },
    build: {
      // Split heavy third-party libraries into their own chunks so no single
      // bundle is oversized, and so a change to app code doesn't bust the cache
      // for these rarely-changing vendors.
      // 600 kB acknowledges the deliberately-isolated vendor libs (jspdf, pdfjs,
      // xlsx); app chunks stay well under this, so the warning still catches real bloat.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Vite/Rollup runtime helpers — `__vitePreload` (used by EVERY lazy
            // route) and the CommonJS interop shims — have no "node_modules" in
            // their id. Left unassigned, Rollup co-locates each one inside the
            // first manual chunk that depends on it: the preload helper landed in
            // three-vendor, so every page load downloaded ~985 kB of 3D code just
            // to get a 1 kB function. Pin them to the always-loaded react-vendor.
            if (
              id.includes('vite/preload-helper') ||
              id.includes('commonjsHelpers') ||
              id.includes('vite/modulepreload-polyfill')
            ) {
              return 'react-vendor';
            }
            if (!id.includes('node_modules')) return;
            // The 3D stack must stay OUT of the eager graph: it is reached only
            // through the lazy import in AssistantAvatar, so it gets its own
            // chunk rather than falling through to the catch-all `vendor`
            // (which the entry does pull in). ~1MB that most sessions never pay.
            // Everything that touches three, plus the state/gesture libs only
            // R3F and drei use. Leaving any of them in `vendor` makes `vendor`
            // import `three-vendor` (rollup reports it as a circular chunk) and
            // the whole 960kB gets pulled back into the eager graph.
            if (
              /node_modules\/(three|@react-three|three-stdlib|three-mesh-bvh|troika|meshline|maath|camera-controls|@monogrid|stats-gl|stats\.js|detect-gpu|@mediapipe|glsl-noise|hls\.js|its-fine|suspend-react|tunnel-rat|zustand|react-use-measure|@use-gesture|utility-types)/.test(
                id,
              )
            ) {
              return 'three-vendor';
            }
            // Tiny shared runtimes used by BOTH eager app code and lazy manual
            // chunks. Pinned here so Rollup can't pull them into three-vendor /
            // pdf / xlsx (a manual chunk absorbs unassigned dependencies), which
            // would make that heavy chunk an eager import of the entry.
            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store|@babel\/runtime|tslib)\//.test(id)) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            if (id.includes('recharts') || id.includes('/d3-') || id.includes('/victory-')) return 'charts';
            if (id.includes('pdfjs-dist')) return 'pdfjs';
            if (id.includes('@supabase')) return 'supabase';
            // No catch-all. A single `vendor` chunk was loaded on first paint and
            // held ~800 kB of jsPDF's dependency tree (pako, canvg, core-js, fflate,
            // dompurify, fast-png…) plus zod. Left unassigned, Rollup places each
            // remaining dependency with its real importers: jsPDF's tree joins the
            // lazy `pdf` chunk, page-only libraries load with their page.
            return undefined;
          },
        },
      },
    },
  };
});
