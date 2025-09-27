import { Card, Progress } from 'antd'
import { Clock, AlertCircle } from 'lucide-react'

function TimerDisplay({ timeRemaining, totalTime, isActive, difficulty }) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const percentage = ((totalTime - timeRemaining) / totalTime) * 100
  
  const isWarning = timeRemaining <= totalTime * 0.2 && timeRemaining > 0
  const isUrgent = timeRemaining <= 10 && timeRemaining > 0

  const getProgressColor = () => {
    if (isUrgent) return '#ef4444'
    if (isWarning) return '#f59e0b'
    return '#3b82f6'
  }

  const formatTime = () => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Card size="small" className={`timer-display ${isUrgent ? 'timer-urgent' : isWarning ? 'timer-warning' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isUrgent ? 'bg-red-100 text-red-600' :
            isWarning ? 'bg-yellow-100 text-yellow-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {isWarning ? <AlertCircle size={20} /> : <Clock size={20} />}
          </div>
          <div>
            <div className={`text-2xl font-bold ${
              isUrgent ? 'text-red-600' :
              isWarning ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              {formatTime()}
            </div>
            <div className="text-sm text-gray-500">
              {isActive ? 'Time remaining' : 'Timer paused'}
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs ml-6">
          <Progress
            percent={percentage}
            strokeColor={getProgressColor()}
            showInfo={false}
            strokeWidth={8}
            className={`${isUrgent ? 'progress-urgent' : ''}`}
          />
          <div className="text-xs text-gray-500 mt-1 text-center">
            {Math.round(percentage)}% completed
          </div>
        </div>
      </div>
      
      {isWarning && (
        <div className={`mt-3 p-2 rounded text-sm ${
          isUrgent ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {isUrgent ? '⚡ Final 10 seconds!' : '⚠️ Running low on time!'}
        </div>
      )}
    </Card>
  )
}

export default TimerDisplay