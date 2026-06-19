export function printA4Report(html: string, title: string): void {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    @media print { body { margin: 0; } }
    body { font-family: 'Vazirmatn', 'Tahoma', sans-serif; font-size: 11pt; direction: rtl; color: #1a1a1a; padding: 20px; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 8px; color: #006194; }
    h2 { font-size: 13pt; margin-bottom: 6px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f0f4f8; padding: 8px 6px; text-align: right; font-size: 10pt; border-bottom: 2px solid #333; }
    td { padding: 6px; text-align: right; font-size: 10pt; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; background: #e8f0fe; }
    .footer { text-align: center; margin-top: 20px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
    .header-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10pt; color: #555; }
  </style>
</head>
<body>
  ${html}
  <div class="footer">&#1578;&#1575;&#1585;&#1740;&#1582; &#1583;&#1585; ${new Date().toLocaleDateString('fa-IR')} &#1670;&#1575;&#1583; &#1588;&#1583;&#1607; &#1575;&#1587;&#1578;</div>
</body>
</html>`)
  win.document.close()
  win.print()
}

export function downloadExcel(filename: string, headers: string[], rows: any[][]): void {
  const BOM = '\uFEFF'
  let csv = BOM + headers.join(',') + '\n'
  for (const row of rows) {
    csv += row.map(cell => {
      const val = String(cell ?? '')
      return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(',') + '\n'
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
