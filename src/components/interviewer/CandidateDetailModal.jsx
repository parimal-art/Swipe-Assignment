import { Modal, Card, Tag, Timeline, Statistic, Row, Col } from 'antd'
import { User, Mail, Phone, FileText, Clock, Award } from 'lucide-react'
import dayjs from 'dayjs'

function CandidateDetailModal({ visible, candidate, onClose }) {
  if (!candidate) return null

  const renderScoreColor = (score) => {
    if (score >= 8) return 'green'
    if (score >= 6) return 'orange'
    return 'red'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green'
      case 'medium': return 'orange'
      case 'hard': return 'red'
      default: return 'blue'
    }
  }

  const timelineItems = candidate.chat
    .filter(entry => entry.answer)
    .map((entry, index) => ({
      color: getDifficultyColor(entry.difficulty),
      children: (
        <div className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Question {entry.qId}</h4>
            <div className="flex items-center space-x-2">
              <Tag color={getDifficultyColor(entry.difficulty)}>
                {entry.difficulty}
              </Tag>
              <Tag color={renderScoreColor(entry.score)}>
                {entry.score}/10
              </Tag>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">{entry.text}</p>
          <div className="bg-gray-50 rounded p-3 mb-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Answer:</p>
            <p className="text-gray-800">{entry.answer}</p>
          </div>
          {entry.feedback && (
            <div className="bg-blue-50 rounded p-3 mb-2">
              <p className="text-sm font-medium text-blue-800 mb-1">AI Feedback:</p>
              <p className="text-sm text-blue-700">{entry.feedback}</p>
            </div>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            Time taken: {entry.timeTaken}s
          </div>
        </div>
      ),
    }))

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <Award className="text-blue-600" size={20} />
          <span>Candidate Details</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      className="candidate-detail-modal"
    >
      <div className="space-y-6">
        {/* Candidate Profile */}
        <Card title="Profile Information" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <div className="flex items-center space-x-2 mb-2">
                <User size={16} className="text-gray-500" />
                <span className="font-medium">{candidate.name}</span>
              </div>
            </Col>
            <Col span={8}>
              <div className="flex items-center space-x-2 mb-2">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm">{candidate.email}</span>
              </div>
            </Col>
            <Col span={8}>
              <div className="flex items-center space-x-2 mb-2">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            </Col>
          </Row>
          {candidate.resume && (
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
              <FileText size={16} className="text-gray-500" />
              <span className="text-sm">Resume: {candidate.resume.fileName}</span>
            </div>
          )}
        </Card>

        {/* Interview Statistics */}
        <Card title="Interview Statistics" size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Final Score"
                value={candidate.finalScore}
                suffix="%"
                valueStyle={{
                  color: candidate.finalScore >= 80 ? '#10b981' : 
                         candidate.finalScore >= 60 ? '#f59e0b' : '#ef4444'
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Questions Answered"
                value={candidate.chat.filter(entry => entry.answer).length}
                suffix={`/ ${candidate.chat.length}`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Average Score"
                value={
                  candidate.chat.filter(entry => entry.score).length > 0
                    ? (candidate.chat
                        .filter(entry => entry.score)
                        .reduce((sum, entry) => sum + entry.score, 0) /
                      candidate.chat.filter(entry => entry.score).length).toFixed(1)
                    : 0
                }
                suffix="/ 10"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Completed"
                value={dayjs(candidate.completedAt).format('MMM DD, YYYY')}
                valueStyle={{ fontSize: '16px' }}
              />
            </Col>
          </Row>
          
          {candidate.finalSummary && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">AI Summary</h4>
              <p className="text-gray-700 bg-blue-50 p-3 rounded">{candidate.finalSummary}</p>
            </div>
          )}
        </Card>

        {/* Interview Transcript */}
        <Card title="Interview Transcript" size="small">
          <Timeline items={timelineItems} />
        </Card>
      </div>
    </Modal>
  )
}

export default CandidateDetailModal