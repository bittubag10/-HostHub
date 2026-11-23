export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="border border-brass/15 rounded-lg py-16 px-6 text-center bg-surface/50">
      <h3 className="text-xl font-display text-ivory mb-2">{title}</h3>
      {subtitle && <p className="text-muted text-sm max-w-md mx-auto">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
