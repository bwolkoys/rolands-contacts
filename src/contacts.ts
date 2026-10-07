export interface Contact {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

export interface ContactsPayload {
  baseId: string
  tableId: string
  records: Contact[]
}

export type SearchMode = 'all' | 'name' | 'notes' | 'event'

// Order fields appear in on the detail view; any other Airtable columns follow.
export const FIELD_ORDER = [
  'First Name',
  'Last Name',
  'Company',
  'Email',
  'Phone',
  'Event',
  'Date',
  'Notes',
]

export function text(c: Contact, field: string): string {
  const v = c.fields[field]
  if (v == null) return ''
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' ? '' : String(x))).join(', ')
  return typeof v === 'object' ? '' : String(v)
}

export function fullName(c: Contact): string {
  return [text(c, 'First Name'), text(c, 'Last Name')].filter(Boolean).join(' ') || 'Unnamed contact'
}

export function initials(c: Contact): string {
  const f = text(c, 'First Name').trim()[0] ?? ''
  const l = text(c, 'Last Name').trim()[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function haystack(c: Contact, mode: SearchMode): string {
  const name = fullName(c)
  switch (mode) {
    case 'name':
      return name
    case 'notes':
      return text(c, 'Notes')
    case 'event':
      return text(c, 'Event')
    default:
      return [name, text(c, 'Notes'), text(c, 'Event'), text(c, 'Company'), text(c, 'Email')].join(' ')
  }
}

// Every word typed must appear somewhere in the chosen field(s).
export function matches(c: Contact, terms: string[], mode: SearchMode): boolean {
  if (terms.length === 0) return true
  const hay = haystack(c, mode).toLowerCase()
  return terms.every((t) => hay.includes(t))
}

export function sortKey(c: Contact): string {
  return text(c, 'Date') || c.createdTime.slice(0, 10)
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function notePreview(notes: string, terms: string[], max = 120): string {
  const flat = notes.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const lower = flat.toLowerCase()
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0]
  if (hit == null || hit < max - 30) return flat.slice(0, max).trimEnd() + '…'
  const start = Math.max(0, hit - 40)
  return '…' + flat.slice(start, start + max).trim() + '…'
}
