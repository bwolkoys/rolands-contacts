import { useCallback, useEffect, useMemo, useState } from 'react'
import ContactDetail from './ContactDetail'
import Highlight from './Highlight'
import {
  formatDate,
  fullName,
  initials,
  matches,
  notePreview,
  sortKey,
  text,
  tokenize,
  type Contact,
  type ContactsPayload,
  type SearchMode,
} from './contacts'

const MODES: { id: SearchMode; label: string; placeholder: string }[] = [
  { id: 'all', label: 'All', placeholder: 'Search names, notes, events…' },
  { id: 'name', label: 'Name', placeholder: 'Search by name…' },
  { id: 'notes', label: 'Notes', placeholder: 'Search notes, e.g. “baseball”' },
  { id: 'event', label: 'Event', placeholder: 'Search by event…' },
]

type Sort = 'recent' | 'az'

export default function App() {
  const [data, setData] = useState<ContactsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('all')
  const [eventFilter, setEventFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('recent')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contacts')
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
      setData(body as ContactsPayload)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const contacts = useMemo(() => data?.records ?? [], [data])
  const terms = useMemo(() => tokenize(query), [query])

  const events = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of contacts) {
      const e = text(c, 'Event').trim()
      if (e) counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [contacts])

  const results = useMemo(() => {
    const list = contacts.filter(
      (c) => matches(c, terms, mode) && (!eventFilter || text(c, 'Event').trim() === eventFilter),
    )
    return list.sort((a, b) =>
      sort === 'az'
        ? fullName(a).localeCompare(fullName(b))
        : sortKey(b).localeCompare(sortKey(a)) || b.createdTime.localeCompare(a.createdTime),
    )
  }, [contacts, terms, mode, eventFilter, sort])

  const open = contacts.find((c) => c.id === openId) ?? null
  const close = useCallback(() => setOpenId(null), [])
  const placeholder = MODES.find((m) => m.id === mode)!.placeholder
  const filtering = terms.length > 0 || eventFilter

  return (
    <div className="app">
      <header className="top">
        <div className="title-row">
          <div>
            <h1>Roland’s Contacts</h1>
            <p className="muted small">
              {loading && !data ? 'Loading…' : `${contacts.length} people`}
            </p>
          </div>
          <button className="icon-btn" onClick={load} aria-label="Refresh from Airtable" disabled={loading}>
            <svg className={loading ? 'spin' : ''} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={placeholder}
          />
          {query && (
            <button className="clear" onClick={() => setQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>

        <div className="segmented" role="tablist" aria-label="Search in">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              className={mode === m.id ? 'active' : ''}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {events.length > 0 && (
          <div className="chips" aria-label="Filter by event">
            <button className={`chip ${eventFilter === null ? 'active' : ''}`} onClick={() => setEventFilter(null)}>
              All events
            </button>
            {events.map(([name, count]) => (
              <button
                key={name}
                className={`chip ${eventFilter === name ? 'active' : ''}`}
                onClick={() => setEventFilter(eventFilter === name ? null : name)}
              >
                {name} <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {error && (
          <div className="notice error">
            <strong>Couldn’t load contacts.</strong>
            <span>{error}</span>
            <button onClick={load}>Try again</button>
          </div>
        )}

        {data && (
          <div className="list-head">
            <span className="muted small">
              {filtering ? `${results.length} of ${contacts.length} match` : 'Everyone'}
            </span>
            <button className="link-btn small" onClick={() => setSort(sort === 'recent' ? 'az' : 'recent')}>
              Sort: {sort === 'recent' ? 'Most recent' : 'A–Z'}
            </button>
          </div>
        )}

        {loading && !data && (
          <ul className="list" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="card skeleton" />
            ))}
          </ul>
        )}

        {data && results.length === 0 && (
          <div className="empty">
            <p>No one matches that search.</p>
            <button
              className="link-btn"
              onClick={() => {
                setQuery('')
                setEventFilter(null)
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <ul className="list">
          {results.map((c) => (
            <ContactRow key={c.id} contact={c} terms={terms} mode={mode} onOpen={() => setOpenId(c.id)} />
          ))}
        </ul>
      </main>

      {open && (
        <ContactDetail
          contact={open}
          terms={terms}
          onClose={close}
          airtableUrl={data ? `https://airtable.com/${data.baseId}/${data.tableId}/${open.id}` : undefined}
        />
      )}
    </div>
  )
}

function ContactRow({
  contact,
  terms,
  mode,
  onOpen,
}: {
  contact: Contact
  terms: string[]
  mode: SearchMode
  onOpen: () => void
}) {
  const company = text(contact, 'Company')
  const event = text(contact, 'Event')
  const date = text(contact, 'Date')
  const notes = text(contact, 'Notes')
  const hl = (m: SearchMode) => (mode === 'all' || mode === m ? terms : [])

  return (
    <li>
      <button className="card" onClick={onOpen}>
        <div className="avatar" aria-hidden="true">{initials(contact)}</div>
        <div className="card-body">
          <div className="card-top">
            <span className="name">
              <Highlight text={fullName(contact)} terms={hl('name')} />
            </span>
            {date && <span className="date small muted">{formatDate(date)}</span>}
          </div>
          {company && (
            <div className="company small muted">
              <Highlight text={company} terms={mode === 'all' ? terms : []} />
            </div>
          )}
          {notes && (
            <p className="note small">
              <Highlight text={notePreview(notes, hl('notes'))} terms={hl('notes')} />
            </p>
          )}
          {event && (
            <span className="event-tag small">
              <Highlight text={event} terms={hl('event')} />
            </span>
          )}
        </div>
      </button>
    </li>
  )
}
