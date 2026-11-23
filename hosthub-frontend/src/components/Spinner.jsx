export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <div className="h-8 w-8 rounded-full border-2 border-brass/30 border-t-brass animate-spin" />
      <span className="text-xs tracking-[0.2em] uppercase font-mono">{label}</span>
    </div>
  )
}
