// src/utils/resumeParser.js
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import mammoth from 'mammoth'

// Let Vite bundle and serve the worker correctly.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.js',
  import.meta.url
).toString()

export async function parseResume(file) {
  const fileType = file.type
  try {
    if (fileType === 'application/pdf') {
      const text = await parsePDF(file)
      return extractFields(text)
    }

    if (
      fileType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const text = await parseDOCX(file)
      return extractFields(text)
    }

    throw new Error('Unsupported file type: ' + fileType)
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw error
  }
}

async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => (item.str ? item.str : ''))
        .join(' ')
      text += pageText + '\n'
    }

    return text
  } catch (err) {
    // Provide clearer message for worker / fetch issues
    const msg =
      err && err.message
        ? `PDF parse failed: ${err.message}`
        : 'PDF parse failed'
    console.error(msg, err)
    throw new Error(msg)
  }
}

async function parseDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    // If you target the browser, ensure you have mammoth/browser build installed.
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value || ''
  } catch (err) {
    console.error('DOCX parse failed:', err)
    throw err
  }
}

function extractFields(text) {
  const normalizedText = text.replace(/\s+/g, ' ').trim()

  // Email
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  const emailMatch = normalizedText.match(emailRegex)
  const email = emailMatch ? emailMatch[0] : ''

  // Phone: capture common international/local forms, return digits only (min 7)
  const phoneRegex =
    /((?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4})/
  const phoneMatch = normalizedText.match(phoneRegex)
  const rawPhone = phoneMatch ? phoneMatch[0] : ''
  const phoneDigits = rawPhone.replace(/\D/g, '')
  const phone = phoneDigits.length >= 7 ? phoneDigits : ''

  // Name: heuristic from top lines
  const lines = text
    .split('\n')
    .map(l => l.replace(/[^A-Za-z\s'-]/g, '').trim())
    .filter(Boolean)

  let name = ''
  for (let i = 0; i < Math.min(7, lines.length); i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    if (
      lower.includes('resume') ||
      lower.includes('curriculum vitae') ||
      lower.includes('cv') ||
      line.includes('@') ||
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)
    ) {
      continue
    }

    const words = line.split(/\s+/).filter(Boolean)
    const capitalizedWords = words.filter(w => /^[A-Z][a-z-']+$/.test(w) && w.length > 1)

    if (capitalizedWords.length >= 2 && capitalizedWords.length <= 4 && line.length < 60) {
      name = capitalizedWords.join(' ')
      break
    }

    if (!name && words.length === 1 && /^[A-Z][a-z-']+$/.test(words[0]) && words[0].length > 1) {
      name = words[0]
      break
    }
  }

  return { name, email, phone }
}
