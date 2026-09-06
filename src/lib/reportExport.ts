import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export type ReportColumn = {
  header: string
  key: string
}

function rowsToAoa(columns: ReportColumn[], rows: Record<string, unknown>[]) {
  return rows.map((row) => columns.map((col) => row[col.key] ?? ""))
}

export function exportToExcel(filename: string, sheetName: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    columns.map((c) => c.header),
    ...rowsToAoa(columns, rows),
  ])
  worksheet["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length + 2, 14) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportToPdf(filename: string, title: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" })

  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rowsToAoa(columns, rows).map((row) => row.map((v) => String(v))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [45, 93, 135] },
    alternateRowStyles: { fillColor: [244, 246, 248] },
  })

  doc.save(`${filename}.pdf`)
}
