export class GoWsClient {
  constructor(url = 'ws://localhost:51820/ws') {
    this.url = url
    this.ws = null
    this.systemInfoCallback = null
    this.commandCallbacks = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // Start with 1 second
    this.isConnected = false
    this.connect()
  }

  connect() {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)
    this.isConnected = false

    this.ws.onopen = () => {
      console.log('[GoWsClient] Connected to Go WebSocket')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
      // Request system info immediately after connection
      this.sendCommand('get-system-info')
    }

    this.ws.onmessage = (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch (err) {
        console.error('[GoWsClient] Invalid JSON:', event.data)
        return
      }

      if (data.os !== undefined && this.systemInfoCallback) {
        this.systemInfoCallback(data)
      }
    }

    this.ws.onclose = (event) => {
      this.isConnected = false
      console.log(`[GoWsClient] Disconnected. Code: ${event.code}, Reason: ${event.reason}`)
      
      // Don't reconnect on normal closure (1000) or if we've hit max attempts
      if (event.code === 1000 || this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`[GoWsClient] Not reconnecting. Code: ${event.code}, Attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        return
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(this.reconnectDelay * (1 + Math.random()), 10000) // Max 10s
      console.log(`[GoWsClient] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.reconnectDelay *= 2 // Double the delay for next time
        this.connect()
      }, delay)
    }

    this.ws.onerror = (err) => {
      console.error('[GoWsClient] WebSocket error:', err)
    }
  }

  onSystemInfo(callback) {
    this.systemInfoCallback = callback
  }

  sendCommand(action, options = {}) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[GoWsClient] WebSocket not open (state: ${this.ws ? this.ws.readyState : 'no socket'}). Queueing command.`)
      // Queue the command for when we reconnect
      setTimeout(() => this.sendCommand(action, options), 1000)
      return
    }
    
    try {
      const msg = JSON.stringify({ action, options })
      console.log(`[GoWsClient] Sending command: ${msg}`)
      this.ws.send(msg)
    } catch (err) {
      console.error('[GoWsClient] Error sending command:', err)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
