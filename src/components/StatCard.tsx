type StatCardProps = {
  label: string
  value: string | number
  tone?: "default" | "green" | "red" | "amber"
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-brand-navy-900",
  green: "text-green-600",
  red: "text-red-600",
  amber: "text-amber-600",
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  )
}
