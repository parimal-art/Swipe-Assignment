import 'dotenv/config'                    // must be first
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import {
  generateQuestionHandler,
  scoreAnswerHandler,
  generateSummaryHandler,
} from './openaiClient.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api', limiter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/generate-question', async (req, res) => {
  // Your logic here
  res.json({ question: 'Example question?' });
})

app.post('/api/score-answer', scoreAnswerHandler)
app.post('/api/generate-summary', generateSummaryHandler)

app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(3001, () => {
  console.log('🚀 Swipe.AI Server running on port 3001')
  console.log(`📝 Health check: http://localhost:${PORT}/health`)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables')
  } else {
    console.log('✅ OpenAI API key configured')
  }
})
