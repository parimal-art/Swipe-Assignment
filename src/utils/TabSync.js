class TabSync {
  constructor() {
    this.channel = null
    this.dispatch = null
  }

  init(dispatch) {
    this.dispatch = dispatch
    
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('Swipe-ai-sync')
      
      this.channel.addEventListener('message', (event) => {
        if (event.data.type === 'STATE_UPDATED') {
          // Handle state updates from other tabs
          // This would typically involve dispatching actions to sync state
          console.log('State update received from other tab:', event.data)
        }
      })
    }
  }

  broadcastUpdate(data) {
    if (this.channel) {
      this.channel.postMessage({
        type: 'STATE_UPDATED',
        data,
        timestamp: Date.now(),
      })
    }
  }

  close() {
    if (this.channel) {
      this.channel.close()
    }
  }
}

export default new TabSync()