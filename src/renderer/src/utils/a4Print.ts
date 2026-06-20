let cachedShopName = 'فروشگاه'
let cachedShopPhone = ''
let cachedTaxRate = 0

export function setShopName(name: string, phone?: string) {
  if (name) cachedShopName = name
  if (phone !== undefined) cachedShopPhone = phone
}

export function setTaxRate(rate: number) {
  cachedTaxRate = rate
}

export function getTaxRate(): number {
  return cachedTaxRate
}

export function printA4Report(html: string, title: string, options?: {
  shopName?: string
  isInvoice?: boolean
  taxRate?: number
  customization?: {
    printColorScheme?: string
    printLogo?: string
    printSignature?: string
    printWatermark?: string
    printWatermarkOpacity?: string
    printShowSignature?: string
    printShowTax?: string
    printFooter?: string
    printInvoiceTitle?: string
    printReprintTitle?: string
    printReportTitle?: string
    printFontSize?: string
    printHeaderSize?: string
    printLineSpacing?: string
    printMarginTop?: string
    printMarginBottom?: string
    printMarginLeft?: string
    printMarginRight?: string
    printPaperSize?: string
    printHeaderField1?: string
    printHeaderField2?: string
    printHeaderField3?: string
    printBorderStyle?: string
    printHeaderAlign?: string
    printActiveTemplate?: string
  }
}): void {
  const win = window.open('', '_blank')
  if (!win) return
  const name = options?.shopName || cachedShopName
  const phone = cachedShopPhone
  const isInvoice = options?.isInvoice ?? false
  const taxRate = options?.taxRate ?? cachedTaxRate
  const cust = options?.customization || {}
  const primaryColor = cust.printColorScheme || '#006194'
  const showSignature = cust.printShowSignature !== 'false'
  const showTax = cust.printShowTax !== 'false'

  const logoHtml = cust.printLogo
    ? `<img src="${cust.printLogo}" style="max-height: 60px; max-width: 200px; display: block; margin: 0 auto 8px auto;" />`
    : ''

  const wmOpacity = cust.printWatermarkOpacity ? (parseInt(cust.printWatermarkOpacity) / 100) : 0.1
  const watermarkStyle = cust.printWatermark
    ? `body::after { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${cust.printWatermark}'); background-repeat: no-repeat; background-position: center; background-size: contain; opacity: ${wmOpacity}; pointer-events: none; z-index: -1; }`
    : ''

  const footerText = cust.printFooter || `تاریخ در ${new Date().toLocaleDateString('fa-IR')} چاپ شده است — ${name}`

  const invoiceSection = isInvoice && showSignature ? `
    <div class="checkbox-group">
      <label><input type="checkbox" /> حقیقی</label>
      <label><input type="checkbox" /> حقوقی</label>
    </div>
    <div>
      <strong style="font-size: 10pt;">توضیحات:</strong>
      <div class="description-box"></div>
    </div>
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-line">محل امضای خریدار</div>
      </div>
      <div class="signature-box">
        ${cust.printSignature ? `<img src="${cust.printSignature}" class="signature-img" />` : ''}
        <div class="signature-line">محل امضای فروشنده</div>
      </div>
    </div>
  ` : ''

  const taxInfo = taxRate > 0 && showTax
    ? `<div style="font-size: 10pt; color: #555; margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;"><strong>مالیات بر ارزش افزوده:</strong> ${taxRate}% (شامل قیمت نهایی می‌باشد)</div>`
    : ''

  const headerFields = [cust.printHeaderField1, cust.printHeaderField2, cust.printHeaderField3]
    .filter(Boolean)
    .map(f => `<div style="margin: 4px 0; font-size: 10pt; border-bottom: 1px dashed #999;">${f}</div>`)
    .join('')

  let borderCSS = ''
  if (cust.printBorderStyle === 'simple') borderCSS = 'body { border-top: 3px solid #006194; border-bottom: 3px solid #006194; padding-top: 10px; }'
  if (cust.printBorderStyle === 'double') borderCSS = 'body { border-top: 6px double #006194; border-bottom: 6px double #006194; padding: 10px 0; }'
  if (cust.printBorderStyle === 'decorative') borderCSS = 'body { border-top: 8px solid #006194; border-bottom: 4px solid #006194; padding: 10px 0; }'

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${cust.printPaperSize || 'A4'}; margin: ${cust.printMarginTop || 15}mm ${cust.printMarginRight || 15}mm ${cust.printMarginBottom || 15}mm ${cust.printMarginLeft || 15}mm; }
    @media print { body { margin: 0; } }
    body { font-family: 'Vazirmatn', 'Tahoma', sans-serif; font-size: ${cust.printFontSize || '11pt'}; line-height: ${cust.printLineSpacing || '1.5'}; direction: rtl; color: #1a1a1a; padding: 20px; }
    h1 { font-size: ${cust.printHeaderSize || '18pt'}; text-align: ${cust.printHeaderAlign || 'center'}; margin-bottom: 4px; color: ${primaryColor}; }
    .shop-name { text-align: ${cust.printHeaderAlign || 'center'}; font-size: 14pt; font-weight: 700; color: ${primaryColor}; margin-bottom: 2px; }
    .shop-phone { text-align: center; font-size: 11pt; color: #555; margin-bottom: 6px; }
    .report-title { text-align: ${cust.printHeaderAlign || 'center'}; font-size: 12pt; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${primaryColor}; }
    h2 { font-size: 12pt; margin-bottom: 6px; color: #333; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f0f4f8; padding: 8px 6px; text-align: right; font-size: 10pt; border-bottom: 2px solid #333; }
    td { padding: 6px; text-align: right; font-size: 10pt; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; background: #e8f0fe; }
    .footer { text-align: center; margin-top: 20px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
    .header-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10pt; color: #555; }
    .checkbox-group { display: flex; gap: 24px; margin: 16px 0; font-size: 10pt; }
    .checkbox-group label { display: flex; align-items: center; gap: 6px; }
    .checkbox-group input[type="checkbox"] { width: 14px; height: 14px; accent-color: ${primaryColor}; }
    .description-box { border: 1px solid #999; border-radius: 4px; min-height: 60px; padding: 8px; margin: 8px 0; font-size: 10pt; color: #999; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; }
    .signature-box { text-align: center; width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 32px; padding-top: 4px; font-size: 9pt; color: #666; }
    .signature-img { max-width: 120px; max-height: 50px; margin-bottom: 4px; display: block; margin-left: auto; margin-right: auto; }
    ${borderCSS}
    ${watermarkStyle}
  </style>
</head>
<body>
  ${logoHtml}
  ${headerFields}
  <div class="shop-name">${name}</div>
  ${phone ? `<div class="shop-phone">تلفن: ${phone}</div>` : ''}
  <div class="report-title">${title}</div>
  ${taxInfo}
  ${html}
  ${invoiceSection}
  <div class="footer">${footerText}</div>
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
