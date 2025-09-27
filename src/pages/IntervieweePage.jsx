import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Steps, Button, message } from 'antd'
import { Upload, User, MessageCircle } from 'lucide-react'
import ResumeUploader from '../components/interviewee/ResumeUploader'
import ProfileCollector from '../components/interviewee/ProfileCollector'
import ChatWindow from '../components/interviewee/ChatWindow'
import { addCandidate, setCurrentCandidate } from '../redux/candidatesSlice'

const { Step } = Steps

function IntervieweePage() {
  const dispatch = useDispatch()
  const { candidates, currentCandidate } = useSelector(state => state.candidates)
  const [currentStep, setCurrentStep] = useState(0)
  
  const candidate = currentCandidate ? candidates[currentCandidate] : null

  useEffect(() => {
    if (!currentCandidate) {
      // Create a new candidate session
      dispatch(addCandidate({}))
    }
  }, [currentCandidate, dispatch])

  useEffect(() => {
    if (candidate) {
      // Determine current step based on candidate state
      if (!candidate.resume) {
        setCurrentStep(0)
      } else if (!candidate.name || !candidate.email || !candidate.phone) {
        setCurrentStep(1)
      } else if (candidate.status === 'created') {
        setCurrentStep(2)
      } else {
        setCurrentStep(3)
      }
    }
  }, [candidate])

  const steps = [
    {
      title: 'Upload Resume',
      icon: <Upload size={20} />,
      description: 'Upload your PDF or DOCX resume',
    },
    {
      title: 'Complete Profile',
      icon: <User size={20} />,
      description: 'Verify your contact information',
    },
    {
      title: 'Ready to Start',
      icon: <MessageCircle size={20} />,
      description: 'Begin your AI interview',
    },
  ]

  const renderStepContent = () => {
    if (!candidate) return null

    switch (currentStep) {
      case 0:
        return <ResumeUploader candidate={candidate} onNext={() => setCurrentStep(1)} />
      case 1:
        return <ProfileCollector candidate={candidate} onNext={() => setCurrentStep(2)} />
      case 2:
        return (
          <Card className="text-center">
            <div className="py-8">
              <MessageCircle size={64} className="mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Start Your Interview!</h2>
              <p className="text-gray-600 mb-6">
                You'll be asked 6 questions of varying difficulty. Take your time and answer thoughtfully.
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(3)}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                Start Interview
              </Button>
            </div>
          </Card>
        )
      default:
        return <ChatWindow candidate={candidate} />
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Interview Assessment</h1>
        <p className="text-slate-600">Complete your AI-powered technical interview</p>
      </div>

      {currentStep < 3 && (
        <Card className="mb-6">
          <Steps current={currentStep} items={steps} className="mb-0" />
        </Card>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        {renderStepContent()}
      </div>
    </div>
  )
}

export default IntervieweePage