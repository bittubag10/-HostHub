import { Sparkles } from 'lucide-react'

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="border border-zinc-200/80 rounded-3xl py-16 px-6 text-center bg-white shadow-sm max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand flex items-center justify-center mx-auto mb-4 border border-brand-100">
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display font-bold text-zinc-900 mb-1.5">{title}</h3>
      {subtitle && <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
