function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <>{text}</>
  const re = new RegExp(`(${terms.map(escape).join('|')})`, 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </>
  )
}
