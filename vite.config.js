/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-mock',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/reset-password')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { email, password } = JSON.parse(body);
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                const supabaseUrl = process.env.VITE_SUPABASE_URL;

                if (serviceKey && supabaseUrl) {
                  const { createClient } = await import('@supabase/supabase-js');
                  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
                  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                  const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
                  if (!targetUser) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Email tidak ditemukan di dalam sistem.' }));
                    return;
                  }
                  await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { password, email_confirm: true });
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Kata sandi berhasil diperbarui (Dev Mode).' }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chakra-vendor': ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
          'framer-vendor': ['framer-motion'],
          'lucide-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
