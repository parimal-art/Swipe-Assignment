import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Question generation templates by difficulty
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

export async function generateQuestionHandler(req, res) {
  try {
    const { difficulty } = req.body

    if (!difficulty || !QUESTION_PROMPTS[difficulty]) {
      return res.status(400).json({ error: 'Invalid difficulty level' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: QUESTION_PROMPTS[difficulty]
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const response = completion.choices[0].message.content.trim()
    
    try {
      const questionData = JSON.parse(response)
      res.json({
        question: questionData.question,
        qId: Date.now(),
        difficulty: questionData.difficulty,
      })
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', response)
      res.status(500).json({ error: 'Failed to parse AI response' })
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    res.status(500).json({ error: 'Failed to generate question' })
  }
}

export async function scoreAnswerHandler(req, res) {
  try {
    const { question, answer, difficulty } = req.body

    if (!question || !answer || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: SCORING_PROMPT
        },
        {
          role: 'user',
          content: `Question (${difficulty}): ${question}\n\nCandidate Answer: ${answer}`
        }
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    const response = completion.choices[0].message.content.trim()
    
    try {
      const scoringData = JSON.parse(response)
      
      // Validate score range
      if (scoringData.score < 0 || scoringData.score > 10) {
        scoringData.score = Math.max(0, Math.min(10, scoringData.score))
      }
      
      res.json(scoringData)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', response)
      res.status(500).json({ error: 'Failed to parse AI response' })
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    res.status(500).json({ error: 'Failed to score answer' })
  }
}

export async function generateSummaryHandler(req, res) {
  try {
    const { candidateTranscript } = req.body

    if (!candidateTranscript || !Array.isArray(candidateTranscript)) {
      return res.status(400).json({ error: 'Invalid candidate transcript' })
    }

    // Format transcript for analysis
    const transcriptText = candidateTranscript
      .filter(entry => entry.answer && entry.score !== null)
      .map(entry => 
        `Q${entry.qId} (${entry.difficulty}): ${entry.text}\nAnswer: ${entry.answer}\nScore: ${entry.score}/10\n`
      )
      .join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: SUMMARY_PROMPT
        },
        {
          role: 'user',
          content: `Interview Transcript:\n${transcriptText}`
        }
      ],
      temperature: 0.2,
      max_tokens: 200,
    })

    const response = completion.choices[0].message.content.trim()
    
    try {
      const summaryData = JSON.parse(response)
      
      // Validate final score range
      if (summaryData.finalScore < 0 || summaryData.finalScore > 100) {
        summaryData.finalScore = Math.max(0, Math.min(100, summaryData.finalScore))
      }
      
      res.json(summaryData)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', response)
      res.status(500).json({ error: 'Failed to parse AI response' })
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
}