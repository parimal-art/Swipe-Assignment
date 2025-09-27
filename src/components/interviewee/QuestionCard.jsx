import { Card, Spin } from 'antd'
import { MessageCircle, Brain, Zap, Target } from 'lucide-react'

function QuestionCard({ question, questionNumber, isGenerating }) {
  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return <Zap className="text-green-600" size={20} />
      case 'medium': return <Target className="text-yellow-600" size={20} />
      case 'hard': return <Brain className="text-red-600" size={20} />
      default: return <MessageCircle className="text-blue-600" size={20} />
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'border-l-green-500 bg-green-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'  
      case 'hard': return 'border-l-red-500 bg-red-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  if (isGenerating) {
    return (
      <Card className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Generating your next question...</p>
      </Card>
    )
  }

  if (!question) return null

  return (
    <Card 
      className={`border-l-4 ${getDifficultyColor(question.difficulty)} question-card`}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getDifficultyIcon(question.difficulty)}
            <span>Question {questionNumber}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty.toUpperCase()}
          </span>
        </div>
      }
    >
      <div className="text-lg leading-relaxed text-gray-800">
        {question.text}
      </div>
    </Card>
  )
}

export default QuestionCard