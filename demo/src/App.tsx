import { useId } from 'useid-polyfill'

// --- Reusable form field component ---
// The canonical use case: linking a <label> to an <input> without
// manually managing IDs or risking collisions when used multiple times.
function FormField({ label, type = 'text' }: { label: string; type?: string }) {
  const id = useId()
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label htmlFor={id ?? undefined}>{label}</label>
      <input id={id ?? undefined} type={type} placeholder={`Enter ${label.toLowerCase()}…`} />
      <p className="id-badge">id: <code>{id ?? '(undefined — hydrating)'}</code></p>
    </div>
  )
}

// --- Component that shows its own raw ID ---
function IdDisplay({ label }: { label: string }) {
  const id = useId()
  return (
    <li id={id ?? undefined}>
      <strong>{label}</strong>: <code>{id ?? '(undefined — hydrating)'}</code>
    </li>
  )
}

export default function App() {
  return (
    <>
      <h1>useid-polyfill demo</h1>
      <p>
        Each component below calls <code>useId()</code> independently.
        IDs are unique, stable across re-renders, and safe for SSR.
      </p>

      <fieldset>
        <legend>Form fields (label ↔ input linking)</legend>
        <FormField label="Email" type="email" />
        <FormField label="Password" type="password" />
        <FormField label="Username" />
      </fieldset>

      <fieldset>
        <legend>Raw ID values</legend>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <IdDisplay label="Component A" />
          <IdDisplay label="Component B" />
          <IdDisplay label="Component C" />
        </ul>
      </fieldset>
    </>
  )
}
