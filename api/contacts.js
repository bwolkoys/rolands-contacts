// Serverless endpoint (Vercel-style: /api/contacts). Set AIRTABLE_TOKEN in the host's env vars.
import { configFromEnv, fetchContacts } from '../server/airtable.js'

export default async function handler(req, res) {
  try {
    const payload = await fetchContacts(configFromEnv(process.env))
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
    res.status(200).json(payload)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
