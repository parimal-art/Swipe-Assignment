import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Card, Button, Input, message } from 'antd'
import { Pause, Play, Send } from 'lucide-react'
import QuestionCard from './QuestionCard'
import TimerDisplay from './TimerDisplay'
import {
  startInterview,
  addQuestion,
  submitAnswer,
  nextQuestion,
  pauseInterview,
  resumeInterview,
  finalizeInterview,
} from '../../redux/candidatesSlice'
import { generateQuestion, scoreAnswer, generateSummary } from '../../api/openai'

const { TextArea } = Input

const QUESTION_SEQUENCE = [
  { difficulty: 'easy', timeLimit: 20 },
  { difficulty: 'easy', timeLimit: 20 },
  { difficulty: 'medium', timeLimit: 60 },
  { difficulty: 'medium', timeLimit: 60 },
  { difficulty: 'hard', timeLimit: 120 },
  { difficulty: 'hard', timeLimit: 120 },
]

function ChatWindow({ candidate }) {
  const dispatch = useDispatch()
  const [messageApi, contextHolder] = message.useMessage()

  const [currentAnswer, setCurrentAnswer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const intervalRef = useRef(null)

  // Defensive guards for candidate props
  const candidateId = candidate?.id
  const currentQuestionIndex = Number.isFinite(candidate?.currentQuestionIndex)
    ? candidate.currentQuestionIndex
    : 0

  const currentQuestion = (candidate?.chat && candidate.chat[currentQuestionIndex]) || null
  const isInterviewComplete = currentQuestionIndex >= QUESTION_SEQUENCE.length || candidate?.status === 'completed'

  // Keep local answer in sync when candidate provides saved input
  useEffect(() => {
    if (!candidate) return

    if (candidate.status === 'created') {
      startInterviewFlow()
    } else if (candidate.status === 'paused') {
      setCurrentAnswer(candidate.currentInput || '')
      setTimeRemaining(Number(candidate.currentTimerRemaining || candidate.currentTimerRemaining || 0))
      setIsPaused(true)
      setIsActive(false)
    } else if (candidate.status === 'in_progress' && !isInterviewComplete) {
      if (!currentQuestion) {
        generateNextQuestion()
      } else if (!currentQuestion.answer && !isActive && !isPaused) {
        const timeLimit = QUESTION_SEQUENCE[currentQuestionIndex]?.timeLimit || 0
        setTimeRemaining(timeLimit)
        setIsActive(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.status, candidateId])

  // Timer effect
  useEffect(() => {
    if (isActive && timeRemaining > 0 && !isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // ensure we call time up handler once
            clearInterval(intervalRef.current)
            intervalRef.current = null
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // only watch these specific flags
  }, [isActive, isPaused, timeRemaining])

  const startInterviewFlow = async () => {
    if (!candidateId) return
    dispatch(startInterview({ id: candidateId }))
    await generateNextQuestion()
  }

  const generateNextQuestion = async () => {
    if (!candidateId) return

    const idx = Number.isFinite(candidate?.currentQuestionIndex) ? candidate.currentQuestionIndex : 0
    if (idx >= QUESTION_SEQUENCE.length) return

    setIsGenerating(true)
    try {
      const questionSpec = QUESTION_SEQUENCE[idx]
      const questionData = await generateQuestion(questionSpec.difficulty)

      dispatch(
        addQuestion({
          id: candidateId,
          question: {
            qId: idx + 1,
            difficulty: questionSpec.difficulty,
            text: questionData.question,
            timeLimit: questionSpec.timeLimit,
          },
        })
      )

      setTimeRemaining(questionSpec.timeLimit)
      setIsActive(true)
      setCurrentAnswer('')
    } catch (error) {
      messageApi.error('Failed to generate question. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!currentQuestion || isSubmitting) return

    setIsSubmitting(true)
    setIsActive(false)

    try {
      const timeTaken = Math.max(0, (QUESTION_SEQUENCE[currentQuestionIndex]?.timeLimit || 0) - timeRemaining)

      const scoring = await scoreAnswer({
        question: currentQuestion.text,
        answer: currentAnswer,
        difficulty: currentQuestion.difficulty,
      })

      dispatch(
        submitAnswer({
          id: candidateId,
          questionIndex: currentQuestionIndex,
          answer: currentAnswer,
          timeTaken,
          score: scoring.score,
          feedback: scoring.feedback,
        })
      )

      if (currentQuestionIndex + 1 >= QUESTION_SEQUENCE.length) {
        await completeInterview()
      } else {
        dispatch(nextQuestion({ id: candidateId }))
        // generate next question will read latest index from candidate prop on next render
        await generateNextQuestion()
      }

      setCurrentAnswer('')
    } catch (error) {
      messageApi.error('Failed to submit answer. Please try again.')
      setIsActive(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTimeUp = async () => {
    if (!isSubmitting) {
      await handleSubmit()
    }
  }

  const handlePause = () => {
    setIsActive(false)
    setIsPaused(true)
    dispatch(
      pauseInterview({
        id: candidateId,
        currentInput: currentAnswer,
        timerRemaining: timeRemaining,
      })
    )
  }

  const handleResume = () => {
    setIsPaused(false)
    setIsActive(true)
    dispatch(resumeInterview({ id: candidateId }))
  }

  const completeInterview = async () => {
    try {
      const summary = await generateSummary({ candidateTranscript: candidate?.chat || [] })

      dispatch(
        finalizeInterview({
          id: candidateId,
          finalScore: summary.finalScore,
          finalSummary: summary.summary,
        })
      )

      messageApi.success('Interview completed successfully!')
    } catch (error) {
      messageApi.error('Failed to generate final summary.')
    }
  }

  if (!candidate) return null

  if (isInterviewComplete) {
    return (
      <>
        {contextHolder}
        <Card className="text-center p-8">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="text-green-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Interview Complete!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
            </p>
            {candidate.finalScore && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{candidate.finalScore}%</div>
                <p className="text-sm text-gray-600">{candidate.finalSummary}</p>
              </div>
            )}
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      {contextHolder}
      <div className="space-y-6">
        {/* Interview Progress */}
        <Card size="small">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Question </span>
              <span className="font-semibold">{currentQuestionIndex + 1} of {QUESTION_SEQUENCE.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              {!isPaused ? (
                <Button
                  icon={<Pause size={16} />}
                  onClick={handlePause}
                  disabled={!isActive || isSubmitting}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<Play size={16} />}
                  onClick={handleResume}
                >
                  Resume
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Current Question */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            isGenerating={isGenerating}
          />
        )}

        {/* Timer */}
        {currentQuestion && (
          <TimerDisplay
            timeRemaining={timeRemaining}
            totalTime={currentQuestion.timeLimit}
            isActive={isActive && !isPaused}
            difficulty={currentQuestion.difficulty}
          />
        )}

        {/* Answer Input */}
        {currentQuestion && !currentQuestion.answer && (
          <Card title="Your Answer">
            <TextArea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              disabled={isPaused || isSubmitting}
            />
            <div className="flex justify-end mt-4">
              <Button
                type="primary"
                icon={<Send size={16} />}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!currentAnswer.trim() || isPaused}
                size="large"
              >
                Submit Answer
              </Button>
            </div>
          </Card>
        )}

        {/* Previous Questions */}
        {Array.isArray(candidate.chat) && candidate.chat.filter(q => q.answer).map((chatEntry, index) => (
          <Card key={chatEntry.qId || index} className="bg-gray-50">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Question {chatEntry.qId}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    chatEntry.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    chatEntry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {chatEntry.difficulty}
                  </span>
                  {chatEntry.score && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {chatEntry.score}/10
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-700">{chatEntry.text}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
              <p className="text-gray-800">{chatEntry.answer}</p>
              {chatEntry.feedback && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-800 mb-1">AI Feedback:</p>
                  <p className="text-sm text-blue-700">{chatEntry.feedback}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

export default ChatWindow
