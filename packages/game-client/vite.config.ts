import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Combined middleware for static asset serving (.tmj, .xml)
    // Optimized to reduce duplicate code while maintaining separate content-type handling
    {
      name: 'serve-game-assets',
      apply: 'serve',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            if (!req.url) {
              next()
              return
            }

            // Content type mapping for different file extensions
            const contentTypeMap: { [key: string]: string } = {
              '.tmj': 'application/json',
              '.xml': 'application/xml',
            }

            // Check if file extension matches our mapped types
            const fileExt = Object.keys(contentTypeMap).find(ext => req.url?.endsWith(ext))
            
            if (fileExt) {
              const filePath = path.join(path.dirname(__dirname), 'public', req.url || '')
              try {
                const content = fs.readFileSync(filePath, 'utf-8')
                res.setHeader('Content-Type', contentTypeMap[fileExt])
                res.end(content)
                return
              } catch (err) {
                res.statusCode = 404
                res.end('File not found')
                return
              }
            }
            next()
          })
        }
      },
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'phaser': ['phaser'],
        },
      },
    },
    // Increase chunk size warning limit (game assets are larger)
    chunkSizeWarningLimit: 1200,
  },
  server: {
    middlewareMode: false,
    hmr: true,
    host: 'localhost',
    port: 5173,
    strictPort: false,
    open: false,
    // Optimize watching for faster rebuilds
    watch: {
      usePolling: false,
      // Ignore node_modules and dist folders from watching
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    },
  },
  optimizeDeps: {
    // Pre-bundle these dependencies for faster startup
    include: [
      'react',
      'react-dom',
      'phaser',
    ],
    // Exclude these to be bundled with main app
    exclude: ['@vite/client'],
  },
  logLevel: 'info',
})
