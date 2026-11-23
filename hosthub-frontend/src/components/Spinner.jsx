import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
      <span className="text-xs tracking-wider uppercase font-mono font-medium text-zinc-400">
        {label}
      </span>
    </div>
  )
}
