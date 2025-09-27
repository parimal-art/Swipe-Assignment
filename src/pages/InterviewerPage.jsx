import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, Table, Button, Input, Space, Tag, Modal } from 'antd'
import { Search, Eye, Trophy } from 'lucide-react'
import { getCompletedCandidates } from '../redux/candidatesSlice'
import CandidateDetailModal from '../components/interviewer/CandidateDetailModal'
import dayjs from 'dayjs'

const { Search: SearchInput } = Input

function InterviewerPage() {
  const candidates = useSelector(state => state.candidates.candidates)
  const [searchText, setSearchText] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const completedCandidates = getCompletedCandidates(candidates)
  
  const filteredCandidates = completedCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div className="flex items-center">
          {index === 0 && <Trophy className="text-yellow-500 mr-1" size={16} />}
          <span className="font-semibold">#{index + 1}</span>
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <span className="text-slate-600">{email}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone', 
      key: 'phone',
      render: (phone) => <span className="text-slate-600">{phone.replace(/(.{3})(.{3})(.{4})/, '($1) $2-$3')}</span>,
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
      render: (score) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'} className="font-semibold">
          {score}%
        </Tag>
      ),
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, candidate) => (
        <Button
          type="primary"
          icon={<Eye size={16} />}
          onClick={() => {
            setSelectedCandidate(candidate)
            setDetailModalVisible(true)
          }}
        >
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Interview Dashboard</h1>
            <p className="text-slate-600">View and manage completed interviews</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{completedCandidates.length}</div>
            <div className="text-sm text-slate-600">Completed Interviews</div>
          </div>
        </div>
        
        <SearchInput
          placeholder="Search by name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<Search size={16} />}
        />
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`,
          }}
          className="interview-table"
        />
      </Card>

      <CandidateDetailModal
        visible={detailModalVisible}
        candidate={selectedCandidate}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedCandidate(null)
        }}
      />
    </div>
  )
}

export default InterviewerPage