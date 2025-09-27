import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Layout, Tabs, message } from 'antd'
import { Users, MessageCircle } from 'lucide-react'
import IntervieweePage from './pages/IntervieweePage'
import InterviewerPage from './pages/InterviewerPage'
import WelcomeBackModal from './components/shared/WelcomeBackModal'
import { setActiveTab, showWelcomeBackModal } from './redux/uiSlice'
import { getInProgressCandidates } from './redux/candidatesSlice'
import TabSync from './utils/TabSync'

const { Header, Content } = Layout

function App() {
  const dispatch = useDispatch()
  const { activeTab } = useSelector((state) => state.ui)
  const candidates = useSelector((state) => state.candidates.candidates)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    // Initialize tab sync
    TabSync.init(dispatch)

    // Check for in-progress sessions on load
    const inProgressCandidates = getInProgressCandidates(candidates)
    if (inProgressCandidates.length > 0) {
      dispatch(showWelcomeBackModal(inProgressCandidates))
    }
  }, [dispatch, candidates])

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <span className="flex items-center gap-2 px-2">
          <MessageCircle size={18} />
          Interviewee
        </span>
      ),
      children: <IntervieweePage messageApi={messageApi} />,
    },
    {
      key: 'interviewer',
      label: (
        <span className="flex items-center gap-2 px-2">
          <Users size={18} />
          Interviewer
        </span>
      ),
      children: <InterviewerPage messageApi={messageApi} />,
    },
  ]

  const handleTabChange = (key) => {
    dispatch(setActiveTab(key))
  }

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {contextHolder}
      <Header className="bg-white shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Swipe.AI</h1>
              <p className="text-sm text-slate-600">Interview Assistant</p>
            </div>
          </div>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            className="interview-tabs"
          />
        </div>
      </Content>

      <WelcomeBackModal />
    </Layout>
  )
}

export default App