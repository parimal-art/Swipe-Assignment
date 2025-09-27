import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

const initialState = {
  candidates: {},
  currentCandidate: null,
}

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action) => {
      const id = uuidv4()
      const candidate = {
        id,
        name: '',
        email: '',
        phone: '',
        resume: null,
        chat: [],
        currentQuestionIndex: 0,
        currentTimerRemaining: 0,
        status: 'created', // created | in_progress | paused | completed
        finalScore: null,
        finalSummary: null,
        createdAt: new Date().toISOString(),
        ...action.payload,
      }
      state.candidates[id] = candidate
      state.currentCandidate = id
    },

    updateProfile: (state, action) => {
      const { id, profile } = action.payload
      if (state.candidates[id]) {
        Object.assign(state.candidates[id], profile)
      }
    },

    startInterview: (state, action) => {
      const { id } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].status = 'in_progress'
        state.candidates[id].currentQuestionIndex = 0
      }
    },

    addQuestion: (state, action) => {
      const { id, question } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].chat.push({
          ...question,
          answer: '',
          score: null,
          feedback: '',
          timeTaken: 0,
          timestamp: new Date().toISOString(),
        })
      }
    },

    submitAnswer: (state, action) => {
      const { id, questionIndex, answer, timeTaken, score, feedback } = action.payload
      if (state.candidates[id] && state.candidates[id].chat[questionIndex]) {
        const chatEntry = state.candidates[id].chat[questionIndex]
        chatEntry.answer = answer
        chatEntry.timeTaken = timeTaken
        chatEntry.score = score
        chatEntry.feedback = feedback
        chatEntry.answeredAt = new Date().toISOString()
      }
    },

    nextQuestion: (state, action) => {
      const { id } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].currentQuestionIndex += 1
      }
    },

    pauseInterview: (state, action) => {
      const { id, currentInput, timerRemaining } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].status = 'paused'
        state.candidates[id].currentTimerRemaining = timerRemaining
        state.candidates[id].currentInput = currentInput
      }
    },

    resumeInterview: (state, action) => {
      const { id } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].status = 'in_progress'
      }
    },

    finalizeInterview: (state, action) => {
      const { id, finalScore, finalSummary } = action.payload
      if (state.candidates[id]) {
        state.candidates[id].status = 'completed'
        state.candidates[id].finalScore = finalScore
        state.candidates[id].finalSummary = finalSummary
        state.candidates[id].completedAt = new Date().toISOString()
      }
    },

    removeCandidate: (state, action) => {
      const { id } = action.payload
      delete state.candidates[id]
      if (state.currentCandidate === id) {
        state.currentCandidate = null
      }
    },

    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload
    },
  },
})

export const {
  addCandidate,
  updateProfile,
  startInterview,
  addQuestion,
  submitAnswer,
  nextQuestion,
  pauseInterview,
  resumeInterview,
  finalizeInterview,
  removeCandidate,
  setCurrentCandidate,
} = candidatesSlice.actions

// Selectors
export const getInProgressCandidates = (candidates) => {
  return Object.values(candidates).filter(c => c.status === 'in_progress' || c.status === 'paused')
}

export const getCompletedCandidates = (candidates) => {
  return Object.values(candidates)
    .filter(c => c.status === 'completed')
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
}

export default candidatesSlice.reducer