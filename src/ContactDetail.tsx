import { useEffect, useRef } from 'react'
import Highlight from './Highlight'
import { FIELD_ORDER, formatDate, fullName, initials, text, type Contact } from './contacts'

interface Props {
  contact: Contact
  terms: string[]
  airtableUrl?: string
  onClose: () => void
}

function renderValue(field: string, value: unknown, terms: string[]) {
  if (value == null || value === '') return null
  if (field === 'Email' && typeof value === 'string') {
    return <a href={`mailto:${value}`}>{value}</a>
  }
  if (field === 'Phone' && typeof value === 'string') {
    return <a href={`tel:${value.replace(/[^\d+]/g, '')}`}>{value}</a>
  }
  if (field === 'Date' && typeof value === 'string') {
    return formatDate(value)
  }
  if (Array.isArray(value)) {
    return (
      <ul className="value-list">
        {value.map((v, i) => {
          if (v && typeof v === 'object' && 'url' in v) {
            const att = v as { url: string; filename?: string; type?: string }
            return (
              <li key={i}>
                {att.type?.startsWith('image/') ? (
                  <a href={att.url} target="_blank" rel="noreferrer">
                    <img className="attachment" src={att.url} alt={att.filename ?? 'attachment'} />
                  </a>
                ) : (
                  <a href={att.url} target="_blank" rel="noreferrer">
                    {att.filename ?? 'Attachment'}
                  </a>
                )}
              </li>
            )
          }
          if (v && typeof v === 'object' && 'name' in v) return <li key={i}>{String((v as { name: unknown }).name)}</li>
          return <li key={i}>{String(v)}</li>
        })}
      </ul>
    )
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    const o = value as { name?: string; email?: string }
    return o.name ?? o.email ?? JSON.stringify(value)
  }
  return <Highlight text={String(value)} terms={terms} />
}

export default function ContactDetail({ contact, terms, airtableUrl, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const email = text(contact, 'Email')
  const phone = text(contact, 'Phone')
  const dial = phone.replace(/[^\d+]/g, '')
  const keys = [
    ...FIELD_ORDER.filter((k) => k in contact.fields),
    ...Object.keys(contact.fields).filter((k) => !FIELD_ORDER.includes(k)),
  ].filter((k) => k !== 'First Name' && k !== 'Last Name')

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <div className="avatar avatar-lg" aria-hidden="true">{initials(contact)}</div>
          <div className="sheet-heading">
            <h2 id="sheet-title">{fullName(contact)}</h2>
            {text(contact, 'Company') && <p className="muted">{text(contact, 'Company')}</p>}
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {(phone || email) && (
          <div className="quick-actions">
            {phone && <a className="action" href={`tel:${dial}`}>Call</a>}
            {phone && <a className="action" href={`sms:${dial}`}>Text</a>}
            {email && <a className="action" href={`mailto:${email}`}>Email</a>}
          </div>
        )}

        <dl className="fields">
          {keys.length === 0 && <p className="muted">No other details saved yet.</p>}
          {keys.map((k) => {
            const v = renderValue(k, contact.fields[k], terms)
            if (v == null) return null
            return (
              <div key={k} className={`field ${k === 'Notes' ? 'field-notes' : ''}`}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            )
          })}
        </dl>

        <footer className="sheet-footer">
          <span className="muted small">Added {formatDate(contact.createdTime)}</span>
          {airtableUrl && (
            <a className="small" href={airtableUrl} target="_blank" rel="noreferrer">
              Open in Airtable ↗
            </a>
          )}
        </footer>
      </div>
    </div>
  )
}
