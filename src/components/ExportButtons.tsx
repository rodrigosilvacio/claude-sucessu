import { FileSpreadsheet, FileText } from "lucide-react"
import { exportToExcel, exportToPdf, type ReportColumn } from "../lib/reportExport"

type ExportButtonsProps = {
  filename: string
  title: string
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
}

export function ExportButtons({ filename, title, columns, rows }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => exportToExcel(filename, title, columns, rows)}
        disabled={rows.length === 0}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
      >
        <FileSpreadsheet size={14} />
        Excel
      </button>
      <button
        type="button"
        onClick={() => exportToPdf(filename, title, columns, rows)}
        disabled={rows.length === 0}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
      >
        <FileText size={14} />
        PDF
      </button>
    </div>
  )
}
