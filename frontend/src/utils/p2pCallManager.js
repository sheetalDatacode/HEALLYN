/**
 * P2P WebRTC Call Manager
 * Provides peer-to-peer WebRTC connection as fallback to SFU
 * Only for 1-to-1 calls
 */

import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '')

class P2PCallManager {
  constructor(callId, socket, getAuthToken) {
    this.callId = callId
    this.socket = socket
    this.getAuthToken = getAuthToken
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    // Default STUN server (will be enhanced with TURN from backend)
    this.iceServers = [
      { urls: ['stun:stun.l.google.com:19302'] }
    ]
  }

  /**
   * Fetch ICE servers from backend (includes TURN if configured)
   */
  async fetchIceServers() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        console.warn('🔗 [P2P] Socket not connected, using default STUN only')
        resolve(this.iceServers)
        return
      }

      this.socket.emit('p2p:getIceServers', {}, (response) => {
        if (response && response.iceServers) {
          
          this.iceServers = response.iceServers
          resolve(this.iceServers)
        } else if (response && response.error) {
          console.warn('🔗 [P2P] Error fetching ICE servers:', response.error, '- using default STUN')
          resolve(this.iceServers) // Fallback to default
        } else {
          console.warn('🔗 [P2P] No ICE servers response, using default STUN')
          resolve(this.iceServers) // Fallback to default
        }
      })

      // Timeout after 3 seconds
      setTimeout(() => {
        console.warn('🔗 [P2P] ICE servers fetch timeout, using default STUN')
        resolve(this.iceServers)
      }, 3000)
    })
  }

  /**
   * Initialize P2P connection
   * @param {boolean} isInitiator - Whether this peer is the initiator
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(isInitiator = false) {
    try {
      this.isInitiator = isInitiator
      

      // Check if WebRTC is supported
      if (!window.RTCPeerConnection) {
        console.error('🔗 [P2P] RTCPeerConnection not supported in this browser')
        throw new Error('WebRTC not supported in this browser')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('🔗 [P2P] getUserMedia not supported in this browser')
        throw new Error('getUserMedia not supported in this browser')
      }

      // Fetch ICE servers from backend (includes TURN if configured)
      
      const iceServers = await this.fetchIceServers()
      
      iceServers.forEach((server, index) => {
        
      })

      // Create RTCPeerConnection
      
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers
      })
      

      // Set up event handlers
      this.setupEventHandlers()
      

      // Get local media stream
      
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        

        this.localStream.getAudioTracks().forEach(track => {
          
          this.peerConnection.addTrack(track, this.localStream)
        })

        
      } catch (mediaError) {
        console.error('🔗 [P2P] ❌ Failed to get user media:', mediaError)
        console.error('🔗 [P2P] Error details:', {
          name: mediaError.name,
          message: mediaError.message,
          constraint: mediaError.constraint
        })
        throw new Error(`Microphone access denied or unavailable: ${mediaError.message}`)
      }

      // If initiator, create offer
      if (isInitiator) {
        
        try {
          await this.createOffer()
          
        } catch (offerError) {
          console.error('🔗 [P2P] ❌ Failed to create offer:', offerError)
          throw new Error(`Failed to create offer: ${offerError.message}`)
        }
      } else {
        
      }

      
      return true
    } catch (error) {
      console.error('🔗 [P2P] ❌ Error initializing P2P:', error)
      console.error('🔗 [P2P] Error stack:', error.stack)
      console.error('🔗 [P2P] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      })
      return false
    }
  }

  setupEventHandlers() {
    // ICE candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        
        if (this.socket && this.socket.connected) {
          this.socket.emit('p2p:iceCandidate', {
            callId: this.callId,
            candidate: event.candidate
          })
        } else {
          console.warn('🔗 [P2P] ⚠️ Socket not connected, cannot send ICE candidate')
        }
      }
    }

    // Track handler (remote stream)
    this.peerConnection.ontrack = (event) => {
      
      
      
      

      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0]
        

        // Log all tracks in the remote stream
        this.remoteStream.getTracks().forEach((track, index) => {
          
        })

        // Trigger callback for remote stream
        if (this.onRemoteStream) {
          
          this.onRemoteStream(this.remoteStream)
        } else {
          console.warn('🔗 [P2P] ⚠️ No onRemoteStream callback set!')
        }
      } else {
        console.warn('🔗 [P2P] ⚠️ No streams in track event!')
      }
    }

    // Connection state handler
    this.peerConnection.onconnectionstatechange = () => {
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState)
      }
    }

    // ICE connection state handler
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState
      

      // Trigger callback for ICE state changes (for fallback detection)
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(iceState)
      }
    }
  }

  async createOffer(options = {}) {
    try {
      

      // Verify local tracks are in the peer connection
      const senders = this.peerConnection.getSenders()
      
      senders.forEach((sender, index) => {
        if (sender.track) {
          
        } else {
          console.warn(`🔗 [P2P] Sender ${index}: no track attached`)
        }
      })

      const offer = await this.peerConnection.createOffer(options)

      // Verify offer includes audio
      
      if (offer.sdp) {
        const hasAudioInSdp = offer.sdp.includes('m=audio')
        
        if (!hasAudioInSdp) {
          console.warn('🔗 [P2P] ⚠️ WARNING: Offer SDP does not contain audio!')
        }
      }

      await this.peerConnection.setLocalDescription(offer)

      
      

      if (!this.socket || !this.socket.connected) {
        console.error('🔗 [P2P] ❌ Socket not connected, cannot send offer!')
        throw new Error('Socket not connected')
      }

      this.socket.emit('p2p:offer', {
        callId: this.callId,
        offer: offer
      })
      
    } catch (error) {
      console.error('🔗 [P2P] Error creating offer:', error)
      throw error
    }
  }

  async handleOffer(offer) {
    try {
      

      // Verify local tracks are still in the peer connection
      const senders = this.peerConnection.getSenders()
      
      senders.forEach((sender, index) => {
        if (sender.track) {
          
        } else {
          console.warn(`🔗 [P2P] Sender ${index}: no track attached`)
        }
      })

      // If no senders with tracks, re-add the local stream
      const hasAudioTrack = senders.some(sender => sender.track && sender.track.kind === 'audio')
      if (!hasAudioTrack && this.localStream) {
        
        this.localStream.getAudioTracks().forEach(track => {
          
          this.peerConnection.addTrack(track, this.localStream)
        })
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

      
      // Create answer - tracks added via addTrack() should be automatically included
      const answer = await this.peerConnection.createAnswer()

      // Verify answer includes audio
      
      if (answer.sdp) {
        const hasAudioInSdp = answer.sdp.includes('m=audio')
        
        if (!hasAudioInSdp) {
          console.warn('🔗 [P2P] ⚠️ WARNING: Answer SDP does not contain audio!')
        }
      }

      await this.peerConnection.setLocalDescription(answer)

      // Verify senders after setting local description
      const sendersAfter = this.peerConnection.getSenders()
      
      sendersAfter.forEach((sender, index) => {
        if (sender.track) {
          
        }
      })

      
      this.socket.emit('p2p:answer', {
        callId: this.callId,
        answer: answer
      })
      
    } catch (error) {
      console.error('🔗 [P2P] Error handling offer:', error)
      throw error
    }
  }

  async handleAnswer(answer) {
    try {
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      
    } catch (error) {
      console.error('🔗 [P2P] Error handling answer:', error)
      throw error
    }
  }

  async handleIceCandidate(candidate) {
    try {
      

      // Check if peer connection is still valid
      if (!this.peerConnection || this.peerConnection.signalingState === 'closed') {
        console.warn('🔗 [P2P] ⚠️ Peer connection is closed, ignoring ICE candidate')
        return
      }

      // Check if candidate is valid
      if (!candidate || (candidate.candidate && candidate.candidate.trim() === '')) {
        console.warn('🔗 [P2P] ⚠️ Invalid ICE candidate (empty), ignoring')
        return
      }

      // Handle null candidate (end of candidates)
      if (candidate.candidate === null || candidate.candidate === undefined) {
        
        await this.peerConnection.addIceCandidate(null)
        
        return
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      
    } catch (error) {
      // Don't throw for ICE candidate errors - they're often non-fatal
      // Common errors: candidate already added, connection closed, invalid candidate
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      const errorName = error?.name || 'Error'

      // Only log as warning for common non-fatal errors
      if (errorMessage.includes('already') ||
        errorMessage.includes('closed') ||
        errorMessage.includes('InvalidStateError')) {
        console.warn(`🔗 [P2P] ⚠️ ICE candidate error (non-fatal): ${errorName} - ${errorMessage}`)
      } else {
        console.error(`🔗 [P2P] ❌ Error handling ICE candidate: ${errorName} - ${errorMessage}`, error)
      }
    }
  }

  /**
   * Set mute state
   */
  setMuted(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
  }

  /**
   * Cleanup P2P connection
   */
  cleanup() {
    

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.localStream
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.remoteStream
  }
}

export default P2PCallManager

