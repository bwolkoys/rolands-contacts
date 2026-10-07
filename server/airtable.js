// Server-side Airtable access. The token never reaches the browser.
const API = 'https://api.airtable.com/v0'

// Defaults point at Roland's contacts base / table / view.
export function configFromEnv(env) {
  return {
    token: env.AIRTABLE_TOKEN,
    baseId: env.AIRTABLE_BASE_ID || 'appwK8xg2CmohFBZc',
    tableId: env.AIRTABLE_TABLE_ID || 'tbl75efSdpUCLuMQv',
    viewId: env.AIRTABLE_VIEW_ID || 'viw81nc9CWWErdzCa',
  }
}

export async function fetchContacts({ token, baseId, tableId, viewId }) {
  if (!token) {
    throw new Error('AIRTABLE_TOKEN is not set. Add it to .env.local (see .env.example).')
  }
  const records = []
  let offset
  do {
    const url = new URL(`${API}/${baseId}/${encodeURIComponent(tableId)}`)
    url.searchParams.set('pageSize', '100')
    if (viewId) url.searchParams.set('view', viewId)
    if (offset) url.searchParams.set('offset', offset)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Airtable responded ${res.status}: ${body.slice(0, 300)}`)
    }
    const data = await res.json()
    for (const r of data.records) {
      records.push({ id: r.id, createdTime: r.createdTime, fields: r.fields })
    }
    offset = data.offset
  } while (offset)
  return { baseId, tableId, records }
}
