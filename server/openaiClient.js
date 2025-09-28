// server/openaiClient.js
import 'dotenv/config'
import fetch from 'node-fetch' // अगर Node 18+ है तो बदल सकते हैं
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables')
}

/* Prompts */
const QUESTION_PROMPTS = {
  easy: `You are an interviewer AI creating easy coding interview questions for a Full Stack developer skilled in React and Node.js. 

Create one concise, beginner-friendly question that tests fundamental concepts. Examples:
- Basic React component structure
- Simple JavaScript array methods
- Basic HTTP methods understanding
- Simple CSS styling

Return ONLY valid JSON: {"question": "your question here", "difficulty": "easy"}`,

  medium: `You are an interviewer AI creating medium-level coding interview questions for a Full Stack developer skilled in React and Node.js.

Create one question that tests intermediate concepts and problem-solving. Examples:
- React hooks usage and lifecycle
- Asynchronous JavaScript and promises
- REST API design principles
- Database relationship concepts

Return ONLY valid JSON: {"question": "your question here", "difficulty": "medium"}`,

  hard: `You are an interviewer AI creating challenging coding interview questions for a Full Stack developer skilled in React and Node.js.

Create one complex question that tests advanced concepts and system design thinking. Examples:
- Performance optimization strategies
- Complex state management patterns
- System architecture decisions
- Scalability and security considerations

Return ONLY valid JSON: {"question": "your question here", "difficulty": "hard"}`
}

const SCORING_PROMPT = `You are an expert technical interviewer evaluating a candidate's answer.

Given the question, candidate's answer, and difficulty level, provide:
1. A numeric score from 0-10
2. Brief constructive feedback (1-2 sentences)

Scoring rubric:
- Easy (0-10): Full concept understanding + clear explanation = 8-10, Partial concept = 4-7, Wrong/incomplete = 0-3
- Medium (0-10): Correct approach + edge cases + trade-offs = 9-10, Correct with gaps = 6-8, Partially correct = 3-5, Wrong = 0-2  
- Hard (0-10): Complete solution + design choices + complexity analysis = 9-10, Good solution = 7-8, Basic solution = 4-6, Wrong = 0-3

Return ONLY valid JSON: {"score": number, "feedback": "constructive feedback here"}`

const SUMMARY_PROMPT = `You are an expert technical interviewer creating a final evaluation summary.

Given the complete interview transcript with questions, answers, and individual scores, provide:
1. A final percentage score (0-100) using weighted average: easy=1x, medium=1.5x, hard=2x
2. A 2-3 sentence summary highlighting key strengths and areas for improvement

Return ONLY valid JSON: {"finalScore": number, "summary": "professional summary here"}`

/* Helper to call Gemini / PaLM generateMessage */
async function callGeminiChat(systemContent, userContent, opts = {}) {
  const model = opts.model || 'chat-bison-001' // change if you prefer another model name
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateMessage?key=${GEMINI_API_KEY}`

  // Gemini expects prompt.messages as objects with `content` fields (no 'role')
  const messages = []
  if (systemContent && systemContent.trim()) messages.push({ content: systemContent })
  if (userContent && userContent.trim()) messages.push({ content: userContent })

  const body = {
    prompt: { messages },
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
    candidateCount: typeof opts.candidateCount === 'number' ? opts.candidateCount : 1
  }

  // debug: uncomment to inspect outgoing payload
  // console.log('Gemini request body:', JSON.stringify(body, null, 2))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${text}`)
  }

  const json = await res.json()
  return extractTextFromGeminiResponse(json)
}

/* Extract text robustly from multiple possible Gemini response shapes */
function extractTextFromGeminiResponse(json) {
  try {
    // common: json.candidates[0].content -> array of chunks or string
    if (json.candidates && Array.isArray(json.candidates) && json.candidates.length) {
      const cand = json.candidates[0]
      if (cand.content) {
        // content may be a string
        if (typeof cand.content === 'string' && cand.content.trim()) return cand.content.trim()

        // or array of content objects with text or parts
        if (Array.isArray(cand.content)) {
          for (const c of cand.content) {
            if (!c) continue
            if (typeof c === 'string' && c.trim()) return c.trim()
            if (typeof c.text === 'string' && c.text.trim()) return c.text.trim()
            if (c.parts && Array.isArray(c.parts)) {
              for (const p of c.parts) {
                if (typeof p === 'string' && p.trim()) return p.trim()
                if (p && typeof p.text === 'string' && p.text.trim()) return p.text.trim()
              }
            }
          }
        }
      }
    }

    // alternate: json.output[0].content[0].text
    if (json.output && Array.isArray(json.output) && json.output[0] && json.output[0].content) {
      const c = json.output[0].content[0]
      if (c) {
        if (typeof c === 'string' && c.trim()) return c.trim()
        if (c.text && typeof c.text === 'string' && c.text.trim()) return c.text.trim()
      }
    }

    // alternate: json.message.content array
    if (json.message && json.message.content && Array.isArray(json.message.content)) {
      for (const part of json.message.content) {
        if (part && part.text && typeof part.text === 'string' && part.text.trim()) return part.text.trim()
        if (typeof part === 'string' && part.trim()) return part.trim()
      }
    }

    // fallback: stringify
    return JSON.stringify(json)
  } catch (e) {
    return JSON.stringify(json)
  }
}

/* Handlers */

export async function generateQuestionHandler(req, res) {
  try {
    const { difficulty } = req.body

    if (!difficulty || !QUESTION_PROMPTS[difficulty]) {
      return res.status(400).json({ error: 'Invalid difficulty level' })
    }

    const systemPrompt = QUESTION_PROMPTS[difficulty]
    const userPrompt = '' // behavior encoded in system prompt

    const responseText = await callGeminiChat(systemPrompt, userPrompt, { temperature: 0.3, candidateCount: 1 })

    try {
      const parsed = JSON.parse(responseText)
      return res.json({
        question: parsed.question,
        qId: Date.now(),
        difficulty: parsed.difficulty,
      })
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', parseError, 'raw:', responseText)
      return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText })
    }
  } catch (error) {
    console.error('Gemini API error (generate question):', error)
    res.status(500).json({ error: 'Failed to generate question', details: error.message })
  }
}

export async function scoreAnswerHandler(req, res) {
  try {
    const { question, answer, difficulty } = req.body

    if (!question || !answer || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const systemPrompt = SCORING_PROMPT
    const userPrompt = `Question (${difficulty}): ${question}\n\nCandidate Answer: ${answer}`

    const responseText = await callGeminiChat(systemPrompt, userPrompt, { temperature: 0.1, candidateCount: 1 })

    try {
      const scoringData = JSON.parse(responseText)
      if (typeof scoringData.score === 'number') {
        scoringData.score = Math.max(0, Math.min(10, scoringData.score))
      }
      return res.json(scoringData)
    } catch (parseError) {
      console.error('JSON parse error (scoring):', parseError, 'Response:', responseText)
      return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText })
    }
  } catch (error) {
    console.error('Gemini API error (score answer):', error)
    res.status(500).json({ error: 'Failed to score answer', details: error.message })
  }
}

export async function generateSummaryHandler(req, res) {
  try {
    const { candidateTranscript } = req.body

    if (!candidateTranscript || !Array.isArray(candidateTranscript)) {
      return res.status(400).json({ error: 'Invalid candidate transcript' })
    }

    const transcriptText = candidateTranscript
      .filter(entry => entry.answer && (entry.score !== null && entry.score !== undefined))
      .map(entry => 
        `Q${entry.qId} (${entry.difficulty}): ${entry.text}\nAnswer: ${entry.answer}\nScore: ${entry.score}/10\n`
      )
      .join('\n')

    const systemPrompt = SUMMARY_PROMPT
    const userPrompt = `Interview Transcript:\n${transcriptText}`

    const responseText = await callGeminiChat(systemPrompt, userPrompt, { temperature: 0.2, candidateCount: 1 })

    try {
      const summaryData = JSON.parse(responseText)
      if (typeof summaryData.finalScore === 'number') {
        summaryData.finalScore = Math.max(0, Math.min(100, summaryData.finalScore))
      }
      return res.json(summaryData)
    } catch (parseError) {
      console.error('JSON parse error (summary):', parseError, 'Response:', responseText)
      return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText })
    }
  } catch (error) {
    console.error('Gemini API error (generate summary):', error)
    res.status(500).json({ error: 'Failed to generate summary', details: error.message })
  }
}
