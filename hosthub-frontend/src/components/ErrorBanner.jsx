import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ error }) {
  if (!error) return null
  const message = typeof error === 'string' ? error : error.message
  const suberrors = typeof error === 'object' ? error.suberrors : null

  return (
    <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-2xl p-4 text-xs shadow-sm flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-rose-800">{message}</p>
        {suberrors?.length > 0 && (
          <ul className="mt-1.5 list-disc list-inside text-rose-700 space-y-0.5">
            {suberrors.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
