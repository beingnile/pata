import { createWorker } from 'tesseract.js'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Receipt Vault utilities
 * Browser-side OCR and archive generation for business receipts.
 */

/**
 * Compress and resize an image file using an offscreen canvas.
 * @param {File|Blob|string} source
 * @param {number} maxWidth
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
export function compressImage(source, maxWidth = 1400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    let src
    if (typeof source === 'string') {
      src = source
    } else if (source instanceof Blob) {
      src = URL.createObjectURL(source)
    } else {
      return reject(new Error('Invalid image source'))
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (source instanceof Blob) URL.revokeObjectURL(src)
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      if (source instanceof Blob) URL.revokeObjectURL(src)
      reject(new Error('Failed to load image'))
    }
    img.src = src
  })
}

/**
 * Convert PDF pages to JPEG image blobs.
 * @param {File|Blob|ArrayBuffer} source
 * @param {number} scale
 * @returns {Promise<Blob[]>}
 */
export async function pdfToImages(source, scale = 1.5) {
  if (typeof window === 'undefined') {
    throw new Error('PDF conversion is only available in the browser')
  }

  // Dynamically import pdf.js so it is not loaded during SSR.
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  let data
  if (source instanceof ArrayBuffer) {
    data = source
  } else {
    data = await source.arrayBuffer()
  }

  const pdf = await pdfjsLib.getDocument({ data }).promise
  const blobs = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Canvas toBlob failed for PDF page'))
        },
        'image/jpeg',
        0.85
      )
    })

    blobs.push(blob)
    page.cleanup()
  }

  return blobs
}

/**
 * Run OCR on an image source (URL/data URL) using Tesseract.js.
 * @param {string} imageSrc
 * @param {(status: string) => void} [onStatus]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function recognizeReceipt(imageSrc, onStatus) {
  onStatus?.('Loading OCR engine...')
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onStatus?.(`Reading receipt... ${Math.round(m.progress * 100)}%`)
      }
    },
  })

  try {
    onStatus?.('Reading receipt...')
    const {
      data: { text, confidence },
    } = await worker.recognize(imageSrc)
    return { text, confidence }
  } finally {
    await worker.terminate()
  }
}

/**
 * Heuristic parser for receipt text.
 * @param {string} text
 * @returns {object}
 */
export function parseReceiptText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const fullText = lines.join('\n')

  // Merchant: prefer a line near the top that looks like a business name.
  let merchant = ''
  const businessIndicators = /\b(LTD|LIMITED|PLC|INC|LLC|PTE|GMBH|SA|COMPANY|CO\.|CORP)\b/i
  const skipWords =
    /\b(total|amount|receipt|reel|invoice|tax|pin|date|time|tel|phone|customer|cashier|change|balance|ksh|kes|usd|\$|subtotal|qty|unit|price|payment|bill to|ship to|description|gst|vat|payment history)\b/i
  const skipChars = /[\]\[\(\)\{\}\*\#\@\!\?\^\&\%\|\\]/

  // First pass: look for a line that clearly looks like a business name.
  for (const line of lines.slice(0, 14)) {
    const clean = line.replace(/\s+/g, ' ').trim()
    if (
      clean.length > 2 &&
      clean.length < 50 &&
      businessIndicators.test(clean) &&
      !skipWords.test(clean) &&
      !skipChars.test(clean) &&
      !/[\d]{1,2}[\/\-\.][\d]{1,2}/.test(clean) &&
      !/[Pp]\d{7,}[A-Za-z]/.test(clean) &&
      !/^\$/.test(clean) &&
      !/^\d+\./.test(clean)
    ) {
      merchant = clean
      break
    }
  }

  // Fallback: first clean line near the top.
  if (!merchant) {
    for (const line of lines.slice(0, 12)) {
      const clean = line.replace(/\s+/g, ' ').trim()
      if (
        clean.length > 2 &&
        clean.length < 45 &&
        !skipWords.test(clean) &&
        !skipChars.test(clean) &&
        !/[\d]{1,2}[\/\-\.][\d]{1,2}/.test(clean) &&
        !/[Pp]\d{7,}[A-Za-z]/.test(clean) &&
        !/^\$/.test(clean) &&
        !/^\d+\./.test(clean)
      ) {
        merchant = clean
        break
      }
    }
  }

  // KRA PIN: P followed by digits and letter, or just label
  const kraPinMatch =
    fullText.match(/[Pp]\s*\.?\s*[Ii]\s*\.?\s*[Nn]\s*:?\s*([A-Za-z0-9]+)/) ||
    fullText.match(/[Kk][Rr][Aa]\s*[Pp][Ii][Nn]\s*:?\s*([A-Za-z0-9]+)/) ||
    fullText.match(/\b([Pp]\d{7,}[A-Za-z])\b/)
  const kraPin = kraPinMatch ? kraPinMatch[1].toUpperCase() : ''

  // Receipt / Invoice number
  const receiptNoMatch =
    fullText.match(/(?:receipt\s*(?:no|number|#))\s*:?\s*([A-Za-z0-9\-/]+)/i) ||
    fullText.match(/(?:rcpt\s*(?:no|number|#))\s*:?\s*([A-Za-z0-9\-/]+)/i) ||
    fullText.match(/\b(?:s\s*l|sl)\s*#?\s*:?\s*([A-Za-z0-9\-/]+)/i)
  const receiptNo = receiptNoMatch ? receiptNoMatch[1].trim() : ''

  const invoiceNoMatch =
    fullText.match(/(?:invoice\s*(?:no|number|#))\s*:?\s*([A-Za-z0-9\-/]+)/i) ||
    fullText.match(/(?:inv\s*(?:no|number|#))\s*:?\s*([A-Za-z0-9\-/]+)/i)
  const invoiceNo = invoiceNoMatch ? invoiceNoMatch[1].trim() : ''

  // Date: try a few common formats
  const dateMatch =
    fullText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/) ||
    fullText.match(/\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/) ||
    fullText.match(/(\d{1,2}\s+[A-Za-z]{3,}\s+\d{4})/) ||
    fullText.match(/([A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})/)
  const date = dateMatch ? dateMatch[1].trim() : ''

  // Time
  const timeMatch = fullText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b/)
  const time = timeMatch ? timeMatch[1].trim() : ''

  // Currency detection: prefer the currency used on the total line.
  let currency = 'KSH'
  const totalCurrencyMatch =
    fullText.match(/(?:amount\s*paid|paid|grand\s*total|total\s*amount|total)\s*:?\s*(\$|KSH|KES|USD)\s*[\d,]+\.?\d*/i)
  if (totalCurrencyMatch) {
    const sym = totalCurrencyMatch[1].toUpperCase()
    currency = sym === '$' ? 'USD' : sym
  } else {
    const currencyMatch = fullText.match(/\b(USD|\$|KSH|KES)\b/i)
    if (currencyMatch) {
      currency = currencyMatch[1].toUpperCase() === '$' ? 'USD' : currencyMatch[1].toUpperCase()
    }
  }

  // Totals: prefer "amount paid", "grand total", "total" lines
  let total = 0
  const totalPatterns = [
    /(?:amount\s*paid|paid)\s*:?\s*[$\s]*([\d,]+\.?\d*)/i,
    /(?:grand\s*total|total\s*amount)\s*:?\s*[$\s]*([\d,]+\.?\d*)/i,
    /\btotal\b\s*:?\s*[$\s]*([\d,]+\.?\d*)/i,
  ]

  for (const pattern of totalPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount > total) total = amount
    }
  }

  // Fallback: largest amount in the receipt (excluding obviously wrong ones)
  if (total === 0) {
    let maxAmount = 0
    for (const line of lines) {
      const amount = extractAmount(line)
      if (amount > maxAmount && amount < 10_000_000) maxAmount = amount
    }
    total = maxAmount
  }

  // Tax/VAT: look for "VAT", "TAX", "GST", "16%" lines
  let tax = 0
  const taxPatterns = [
    /(?:vat|tax|gst)\s*(?:amount)?\s*:?\s*[$\s]*([\d,]+\.?\d*)/i,
    /\b(?:vat|tax|gst)\s*\(?\d+%\)?\s*:?\s*[$\s]*([\d,]+\.?\d*)/i,
  ]
  for (const pattern of taxPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount > 0 && amount < total) {
        tax = amount
        break
      }
    }
  }

  return {
    merchant,
    date,
    time,
    total,
    tax,
    currency,
    kraPin,
    receiptNo,
    invoiceNo,
    rawText: fullText,
  }
}

/**
 * Parse a numeric amount string, handling commas and decimals.
 * @param {string} value
 * @returns {number}
 */
function parseAmount(value) {
  if (!value) return 0
  const clean = value.replace(/,/g, '')
  const parsed = parseFloat(clean)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Extract the largest numeric amount from a line of text.
 * @param {string} line
 * @returns {number}
 */
function extractAmount(line) {
  const matches = line.match(/[\d,]+\.?\d*/g)
  if (!matches) return 0
  let best = 0
  for (const m of matches) {
    const value = parseAmount(m)
    if (value > best) best = value
  }
  return best
}

/**
 * Convert a list of receipts to CSV.
 * @param {Array} receipts
 * @returns {string}
 */
export function receiptsToCsv(receipts) {
  const headers = [
    'Date',
    'Time',
    'Merchant',
    'Receipt No',
    'Invoice No',
    'KRA PIN',
    'Currency',
    'Total',
    'Tax',
    'Raw Text',
  ]
  const rows = receipts.map((r) => [
    r.date || '',
    r.time || '',
    r.merchant || '',
    r.receiptNo || '',
    r.invoiceNo || '',
    r.kraPin || '',
    r.currency || 'KSH',
    r.total || 0,
    r.tax || 0,
    `"${(r.rawText || '').replace(/"/g, '""')}"`,
  ])
  return [headers, ...rows].map((row) => row.join(',')).join('\n')
}

/**
 * Convert a list of receipts to pretty-printed JSON.
 * @param {Array} receipts
 * @returns {string}
 */
export function receiptsToJson(receipts) {
  return JSON.stringify(receipts, null, 2)
}

/**
 * Create and trigger download of a ZIP archive containing images, JSON and CSV.
 * @param {Array} receipts — objects with { id, imageBlob, imageName, ...parsedFields }
 */
export async function downloadReceiptsZip(receipts) {
  const zip = new JSZip()
  const imagesFolder = zip.folder('images')

  const archiveData = receipts.map((r) => {
    const { imageBlob, imageName, ...rest } = r
    return rest
  })

  zip.file('receipts.json', receiptsToJson(archiveData))
  zip.file('receipts.csv', receiptsToCsv(archiveData))

  for (const r of receipts) {
    if (r.imageBlob) {
      imagesFolder.file(r.imageName || `receipt-${r.id}.jpg`, r.imageBlob)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const fileName = `pata-receipts-${new Date().toISOString().slice(0, 10)}.zip`
  saveAs(blob, fileName)
}
