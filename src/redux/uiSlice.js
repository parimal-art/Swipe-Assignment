import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeTab: 'interviewee',
  welcomeBackModal: {
    visible: false,
    candidates: [],
  },
  notifications: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
    },

    showWelcomeBackModal: (state, action) => {
      state.welcomeBackModal = {
        visible: true,
        candidates: action.payload,
      }
    },

    hideWelcomeBackModal: (state) => {
      state.welcomeBackModal.visible = false
    },

    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      })
    },

    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
  },
})

export const {
  setActiveTab,
  showWelcomeBackModal,
  hideWelcomeBackModal,
  addNotification,
  removeNotification,
} = uiSlice.actions

export default uiSlice.reducer