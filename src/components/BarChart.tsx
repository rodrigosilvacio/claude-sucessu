const DEFAULT_COLORS = [
  "bg-brand-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-slate-400",
  "bg-purple-500",
  "bg-teal-500",
]

type BarChartProps = {
  data: { label: string; value: number; color?: string }[]
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{d.label}</span>
            <span className="font-medium text-brand-navy-900">{d.value}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-slate-400">Sem dados.</p>}
    </div>
  )
}
