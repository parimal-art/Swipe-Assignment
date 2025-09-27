import { Modal, Card, Button, List, Tag } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { Play, RotateCcw, User } from 'lucide-react'
import { hideWelcomeBackModal } from '../../redux/uiSlice'
import { setCurrentCandidate, resumeInterview, removeCandidate } from '../../redux/candidatesSlice'
import dayjs from 'dayjs'

function WelcomeBackModal() {
  const dispatch = useDispatch()
  const { welcomeBackModal } = useSelector(state => state.ui)

  const handleResume = (candidateId) => {
    dispatch(setCurrentCandidate(candidateId))
    dispatch(resumeInterview({ id: candidateId }))
    dispatch(hideWelcomeBackModal())
  }

  const handleStartOver = (candidateId) => {
    dispatch(removeCandidate({ id: candidateId }))
    dispatch(hideWelcomeBackModal())
  }

  const handleClose = () => {
    dispatch(hideWelcomeBackModal())
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <Play className="text-blue-600" size={20} />
          <span>Welcome Back!</span>
        </div>
      }
      visible={welcomeBackModal.visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      className="welcome-back-modal"
    >
      <div className="mb-4">
        <p className="text-gray-600">
          We found {welcomeBackModal.candidates.length} incomplete interview{welcomeBackModal.candidates.length > 1 ? 's' : ''}. 
          Would you like to resume or start over?
        </p>
      </div>

      <List
        dataSource={welcomeBackModal.candidates}
        renderItem={(candidate) => (
          <List.Item className="px-0">
            <Card size="small" className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {candidate.name || 'Unnamed Candidate'}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Question {candidate.currentQuestionIndex + 1} of 6</span>
                      <Tag color={candidate.status === 'paused' ? 'orange' : 'blue'}>
                        {candidate.status}
                      </Tag>
                      <span>• {dayjs(candidate.createdAt).fromNow()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="primary"
                    icon={<Play size={16} />}
                    onClick={() => handleResume(candidate.id)}
                  >
                    Resume
                  </Button>
                  <Button
                    icon={<RotateCcw size={16} />}
                    onClick={() => handleStartOver(candidate.id)}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </Modal>
  )
}

export default WelcomeBackModal