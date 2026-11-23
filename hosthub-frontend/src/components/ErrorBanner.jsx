export default function ErrorBanner({ error }) {
  if (!error) return null
  const message = typeof error === 'string' ? error : error.message
  const suberrors = typeof error === 'object' ? error.suberrors : null

  return (
    <div className="border border-danger/40 bg-danger/10 text-ivory rounded-md px-4 py-3 text-sm">
      <p className="font-medium">{message}</p>
      {suberrors?.length > 0 && (
        <ul className="mt-1.5 list-disc list-inside text-ivory/80 space-y-0.5">
          {suberrors.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
