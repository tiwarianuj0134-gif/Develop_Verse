import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed.
    // Feel free to remove this code if you're no longer developing your app with these tools.
    mode === "development"
      ? {
          name: "inject-dev-tools",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-dev-tools */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
    // End of code for taking screenshots in development.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code splitting configuration for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-convex': ['convex/react'],
          'vendor-ui': ['sonner', 'clsx', 'tailwind-merge'],
          // Component chunks
          'components-pages': [
            './src/components/Dashboard.tsx',
            './src/components/AcademicsPage.tsx',
            './src/components/ExamsPage.tsx',
            './src/components/FitnessPage.tsx',
            './src/components/WellnessPage.tsx',
            './src/components/MentalHealthPage.tsx',
          ],
        },
      },
    },
    // Enable minification for production
    minify: 'terser',
    // Optimize CSS
    cssMinify: true,
    // Optimize images
    assetsInlineLimit: 4096,
    // Source maps for production debugging
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'convex/react',
      'sonner',
      'clsx',
      'tailwind-merge'
    ],
  },
}));
