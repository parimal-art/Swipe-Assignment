import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`

export async function parseResume(file) {
  const fileType = file.type
  let text = ''

  try {
    if (fileType === 'application/pdf') {
      text = await parsePDF(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await parseDOCX(file)
    } else {
      throw new Error('Unsupported file type')
    }

    return extractFields(text)
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw error
  }
}

async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  
  let text = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ')
    
    text += pageText + '\n'
  }
  
  return text
}

async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

function extractFields(text) {
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  
  // Extract email
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  const emailMatch = normalizedText.match(emailRegex)
  const email = emailMatch ? emailMatch[0] : ''

  // Extract phone number
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  const phoneMatch = normalizedText.match(phoneRegex)
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : ''

  // Extract name (heuristic approach)
  const lines = text.split('\n').filter(line => line.trim())
  let name = ''
  
  // Look for name patterns at the beginning of the resume
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    
    // Skip common header words and contact info
    if (line.toLowerCase().includes('resume') || 
        line.toLowerCase().includes('cv') ||
        line.includes('@') ||
        /\d{3}-\d{3}-\d{4}/.test(line)) {
      continue
    }
    
    // Look for lines with 2-3 capitalized words (likely names)
    const words = line.split(' ').filter(word => word.trim())
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]+$/.test(word) && word.length > 1
    )
    
    if (capitalizedWords.length >= 2 && capitalizedWords.length <= 3 && line.length < 50) {
      name = capitalizedWords.join(' ')
      break
    }
  }

  return {
    name,
    email,
    phone,
  }
}