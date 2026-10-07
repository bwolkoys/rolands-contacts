import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { configFromEnv, fetchContacts } from './server/airtable.js'

// Serves /api/contacts during `npm run dev` and `npm run preview`,
// so the Airtable token stays on the server side.
function airtableApi(env: Record<string, string>): Plugin {
  const handler: Connect.NextHandleFunction = async (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const payload = await fetchContacts(configFromEnv(env))
      res.end(JSON.stringify(payload))
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
    }
  }
  return {
    name: 'airtable-api',
    configureServer(server) {
      server.middlewares.use('/api/contacts', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/contacts', handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react(), airtableApi(env)],
  }
})
