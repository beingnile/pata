import { createWorker } from 'tesseract.js'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Receipt Vault utilities
 * Browser-side OCR and archive generation for Kenyan business receipts.
 */

/**
 * Compress and resize an image file using an offscreen canvas.
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
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
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
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
 * Heuristic parser for Kenyan receipt text.
 * @param {string} text
 * @returns {object}
 */
export function parseReceiptText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const fullText = lines.join('\n')
  const lowerText = fullText.toLowerCase()

  // Merchant: prefer a line near the top that looks like a business name
  let merchant = ''
  const skipWords = /total|amount|receipt|invoice|tax|pin|date|time|tel|phone|customer|cashier|change|balance|ksh|kes|/i
  for (const line of lines.slice(0, 8)) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !skipWords.test(line) &&
      !/[\d]{2}[\/\-\.][\d]{2}/.test(line) &&
      !/[Pp]\d{7,}[A-Za-z]/.test(line)
    ) {
      merchant = line.replace(/\s+/g, ' ').trim()
      break
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
    fullText.match(/(?:receipt|invoice|rcpt|inv)\s*#?\s*:?\s*([A-Za-z0-9\-/]+)/i) ||
    fullText.match(/\b(?:s\s*l|sl)\s*#?\s*:?\s*([A-Za-z0-9\-/]+)/i)
  const receiptNo = receiptNoMatch ? receiptNoMatch[1].trim() : ''

  // Date: try a few common formats
  const dateMatch =
    fullText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/) ||
    fullText.match(/\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/) ||
    fullText.match(/(\d{1,2}\s+[A-Za-z]{3,}\s+\d{4})/)
  const date = dateMatch ? dateMatch[1].trim() : ''

  // Time
  const timeMatch = fullText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b/)
  const time = timeMatch ? timeMatch[1].trim() : ''

  // Totals: look for lines with KSH/KES and a number, near the word total
  let total = 0
  let tax = 0

  // First attempt: find "TOTAL" line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    if (
      /\b(total|grand total|amount due|balance due|net total)\b/i.test(line) &&
      !/subtotal|sub.?total|item total/i.test(line)
    ) {
      const amount = extractAmount(line)
      if (amount > total) total = amount
    }
  }

  // Fallback: largest amount in the receipt
  if (total === 0) {
    let maxAmount = 0
    for (const line of lines) {
      const amount = extractAmount(line)
      if (amount > maxAmount) maxAmount = amount
    }
    total = maxAmount
  }

  // Tax/VAT: look for "VAT", "TAX", "16%" lines
  for (const line of lines) {
    if (/\b(vat|tax|vat amount|tax amount|16%|totals tax)\b/i.test(line)) {
      const amount = extractAmount(line)
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
    kraPin,
    receiptNo,
    rawText: fullText,
  }
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
    const clean = m.replace(/,/g, '')
    const value = parseFloat(clean)
    if (!Number.isNaN(value) && value > best) best = value
  }
  return best
}

/**
 * Convert a list of receipts to CSV.
 * @param {Array} receipts
 * @returns {string}
 */
export function receiptsToCsv(receipts) {
  const headers = ['Date', 'Time', 'Merchant', 'Receipt No', 'KRA PIN', 'Total (KSH)', 'Tax (KSH)', 'Raw Text']
  const rows = receipts.map((r) => [
    r.date || '',
    r.time || '',
    r.merchant || '',
    r.receiptNo || '',
    r.kraPin || '',
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
 * @param {Array} receipts — objects with { id, imageBlob, ...parsedFields }
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
