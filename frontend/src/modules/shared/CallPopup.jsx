import { useState, useEffect, useRef, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";
import {
  IoCallOutline,
  IoMicOutline,
  IoMicOffOutline,
  IoCloseOutline,
  IoRemoveOutline,
} from "react-icons/io5";
import { formatCallDuration, isWebRTCSupported } from "../../utils/callService";
import { getAuthToken } from "../../utils/apiClient";
import { useCall } from "../../contexts/CallContext";
import { getSocket } from "../../utils/socketClient";
import P2PCallManager from "../../utils/p2pCallManager";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SOCKET_URL = API_BASE_URL.replace("/api", "").replace(/\/$/, "");

const CallPopup = () => {
  const { activeCall, endCall, isMinimized, minimize, maximize } = useCall();
  const callId = activeCall?.callId;

  const [status, setStatus] = useState("connecting"); // connecting, connected, ended, error
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [remoteParticipant, setRemoteParticipant] = useState(
    activeCall?.remoteParticipant || "Participant"
  );
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [useP2P, setUseP2P] = useState(true); // P2P enabled by default (SFU has issues)
  const p2pManagerRef = useRef(null);
  const roomJoinedRef = useRef(false); // Track if we successfully joined the call room
  const hasAttemptedFallbackRef = useRef(false); // Track if we've already attempted SFU fallback
  const isSwitchingToSFURef = useRef(false); // Track if we're currently switching to SFU
  const p2pConnectionTimeoutRef = useRef(null); // Track P2P connection timeout

  // Refs
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerRef = useRef(null);
  const consumerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const isEndingRef = useRef(false); // Prevent duplicate call end
  const callIdRef = useRef(callId); // Store callId in ref to avoid stale closures

  // Determine module from token
  const getModule = () => {
    const token = getAuthToken("doctor") || getAuthToken("patient");
    if (getAuthToken("doctor")) return "doctor";
    if (getAuthToken("patient")) return "patient";
    return "patient"; // default
  };

  // Store activeCall in ref to avoid stale closures
  const activeCallRef = useRef(activeCall);

  // Update activeCall ref when it changes
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Unified handler for call:ended events from any socket
  const handleCallEndedUnified = useCallback(
    (data) => {
      const currentCallId = callIdRef.current;
      const currentActiveCall = activeCallRef.current;

      
      
      
      
      

      // Prevent duplicate processing
      if (isEndingRef.current) {
        
        return;
      }

      // Process if:
      // 1. CallId matches exactly, OR
      // 2. We have an activeCall (fallback - process even if callId doesn't match)
      const callIdMatches =
        data && data.callId && data.callId === currentCallId;
      const hasActiveCall = currentActiveCall && currentActiveCall.callId;

      if (!callIdMatches && !hasActiveCall) {
        
        return;
      }

      if (!callIdMatches && hasActiveCall) {
        console.warn(
          "📞 [CallPopup] call:ended event callId mismatch, but processing anyway because we have activeCall"
        );
        console.warn(
          "📞 [CallPopup] Expected:",
          currentCallId,
          "Received:",
          data?.callId
        );
      }

      
      isEndingRef.current = true;

      // End the call (don't emit to server as it's already ended by other party)
      cleanup();
      setStatus("ended");
      setTimeout(() => {
        
        endCall();
        isEndingRef.current = false;
      }, 500);
    },
    [endCall]
  );

  // Unified handler for call:patientJoined events - resend offer
  const handlePatientJoinedUnified = useCallback(
    async (data) => {
      
      

      if (data.callId && data.callId !== callIdRef.current) {
        
        return;
      }

      // Only Initiator (Doctor) needs to resend offer
      const module = getModule();

      // Check if we are using P2P and manager exists
      if (module === "doctor" && useP2P && p2pManagerRef.current) {
        
        try {
          // Add a small delay to ensure patient is fully ready to receive
          setTimeout(async () => {
            try {
              if (p2pManagerRef.current) {
                
                await p2pManagerRef.current.createOffer({ iceRestart: true });
              }
            } catch (err) {
              console.error("📞 [CallPopup] Error resending offer:", err);
            }
          }, 1500);
        } catch (error) {
          console.error("📞 [CallPopup] Error triggering offer resend:", error);
        }
      }
    },
    [useP2P]
  );

  useEffect(() => {
    if (!callId) {
      return; // Don't initialize if no call
    }

    if (!isWebRTCSupported()) {
      setError("WebRTC is not supported in this browser");
      setStatus("error");
      return;
    }

    // Reset state when callId changes
    setStatus("connecting");
    setError(null);
    setCallDuration(0);
    setIsMuted(false);
    isEndingRef.current = false; // Reset ending flag for new call
    isSwitchingToSFURef.current = false; // Reset switching flag
    hasAttemptedFallbackRef.current = false; // Reset fallback flag
    callIdRef.current = callId; // Update ref with current callId

    // Set up call:ended listener on shared socket immediately (before socket connects)
    // This ensures we receive the event even if CallPopup creates a new socket
    const sharedSocket = getSocket();
    let sharedSocketCleanup = null;

    if (sharedSocket) {
      
      

      // Use the unified handler
      sharedSocket.on("call:ended", handleCallEndedUnified);

      sharedSocketCleanup = () => {
        sharedSocket.off("call:ended", handleCallEndedUnified);
      };
    }

    // Also listen for window-level force end event as fallback
    const handleForceEnd = () => {
      
      if (!isEndingRef.current && callIdRef.current) {
        
        isEndingRef.current = true;
        cleanup();
        setStatus("ended");
        setTimeout(() => {
          endCall();
          isEndingRef.current = false;
        }, 500);
      }
    };

    window.addEventListener("call:forceEnd", handleForceEnd);

    initializeCall();

    return () => {
      // Don't cleanup if we're switching to SFU (cleanup will happen after switch completes)
      if (!isSwitchingToSFURef.current) {
        cleanup();
      } else {
        
      }
      if (sharedSocketCleanup) {
        sharedSocketCleanup();
      }
      window.removeEventListener("call:forceEnd", handleForceEnd);
    };
  }, [callId, handleCallEndedUnified, endCall, handlePatientJoinedUnified]);

  // Update remoteParticipant when activeCall changes
  useEffect(() => {
    if (activeCall?.remoteParticipant) {
      setRemoteParticipant(activeCall.remoteParticipant);
    }
  }, [activeCall?.remoteParticipant]);

  // Continuously monitor transport states when connected (SFU mode)
  useEffect(() => {
    if (status !== "connected" || useP2P) {
      return; // Only monitor in SFU mode when connected
    }

    const sendTransport = sendTransportRef.current;
    const recvTransport = recvTransportRef.current;

    if (!sendTransport || !recvTransport) {
      return; // Transports not initialized yet
    }

    

    // Check transport states periodically
    const checkInterval = setInterval(() => {
      const sendState = sendTransport.connectionState;
      const recvState = recvTransport.connectionState;
      const sendClosed = sendTransport.closed;
      const recvClosed = recvTransport.closed;

      // If transports are closed or failed, update status
      if (
        sendClosed ||
        recvClosed ||
        sendState === "failed" ||
        recvState === "failed"
      ) {
        console.error(
          "📞 [CallPopup] ⚠️ Transport monitoring detected failure:",
          {
            sendState,
            recvState,
            sendClosed,
            recvClosed,
          }
        );
        setError(
          "Connection lost. The transports have failed. Please try ending and restarting the call."
        );
        setStatus("error");
        clearInterval(checkInterval);
      } else if (
        sendState === "connected" &&
        recvState === "connected" &&
        !sendClosed &&
        !recvClosed
      ) {
        // Transports are healthy - ensure status is connected
        if (status !== "connected") {
          
          setStatus("connected");
        }
      }
    }, 3000); // Check every 3 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [status, useP2P]);

  // Keep audio and microphone active when minimized
  useEffect(() => {
    if (!isMinimized || status !== "connected") {
      return;
    }

    

    const keepAudioActive = () => {
      // Keep remote audio playing
      const audioElement = remoteAudioRef.current;
      if (audioElement && audioElement.srcObject && audioElement.paused) {
        
        audioElement.play().catch((err) => {
          console.error("📞 [CallPopup] Error resuming audio:", err);
        });
      }

      // Keep local microphone enabled (P2P)
      if (p2pManagerRef.current && p2pManagerRef.current.localStream) {
        p2pManagerRef.current.localStream.getAudioTracks().forEach((track) => {
          if (!track.enabled) {
            
            track.enabled = true;
          }
        });
      }

      // Keep local microphone enabled (SFU)
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          if (!track.enabled) {
            
            track.enabled = true;
          }
        });
      }

      // Keep producer track enabled (SFU)
      if (producerRef.current && producerRef.current.track) {
        if (!producerRef.current.track.enabled) {
          
          producerRef.current.track.enabled = true;
        }
      }
    };

    // Check immediately
    keepAudioActive();

    // Set up interval to periodically check and resume if needed
    const interval = setInterval(keepAudioActive, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isMinimized, status]);

  // Function to switch from P2P to SFU when P2P fails
  const switchToSFU = async () => {
    if (isSwitchingToSFURef.current) {
      
      return;
    }

    isSwitchingToSFURef.current = true;
    

    try {
      const socket = socketRef.current;
      const currentCallId = callIdRef.current;

      if (!socket || !currentCallId) {
        console.error(
          "🔄 [Fallback] Missing socket or callId, cannot switch to SFU"
        );
        setError("Failed to switch to SFU. Please try again.");
        setStatus("error");
        isSwitchingToSFURef.current = false;
        return;
      }

      // Reset ending flag before switching
      isEndingRef.current = false;

      // Clean up P2P connection (but don't call full cleanup() as it disconnects socket)
      if (p2pManagerRef.current) {
        
        try {
          p2pManagerRef.current.cleanup();
        } catch (error) {
          console.warn("🔄 [Fallback] Error cleaning up P2P:", error);
        }
        p2pManagerRef.current = null;
      }

      // Remove P2P event handlers
      if (socket._p2pHandlers) {
        
        socket.off("p2p:offer", socket._p2pHandlers.offer);
        socket.off("p2p:answer", socket._p2pHandlers.answer);
        socket.off("p2p:iceCandidate", socket._p2pHandlers.iceCandidate);
        delete socket._p2pHandlers;
      }

      // Clear P2P connection timeout
      if (p2pConnectionTimeoutRef.current) {
        clearTimeout(p2pConnectionTimeoutRef.current);
        p2pConnectionTimeoutRef.current = null;
      }

      // Update state to use SFU
      setUseP2P(false);
      setStatus("connecting");
      setError(null);

      

      // Call the SFU initialization code
      await initializeSFU(socket, currentCallId);

      
    } catch (error) {
      console.error("🔄 [Fallback] ❌ Error switching to SFU:", error);
      setError("Failed to switch to SFU. Please try again.");
      setStatus("error");
      isEndingRef.current = false; // Reset on error
    } finally {
      isSwitchingToSFURef.current = false;
    }
  };

  // Extract SFU initialization logic into a separate function
  const initializeSFU = async (socket, currentCallId) => {
    try {
      

      // Get RTP capabilities
      const { rtpCapabilities, iceServers } = await new Promise(
        (resolve, reject) => {
          socket.emit(
            "mediasoup:getRtpCapabilities",
            { callId: currentCallId },
            (response) => {
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            }
          );
        }
      );

      // Create device
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;

      // Create send transport
      const sendTransportData = await new Promise((resolve, reject) => {
        socket.emit(
          "mediasoup:createWebRtcTransport",
          { callId: currentCallId },
          (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.transport);
            }
          }
        );
      });

      const sendTransport = device.createSendTransport({
        id: sendTransportData.id,
        iceParameters: sendTransportData.iceParameters,
        iceCandidates: sendTransportData.iceCandidates,
        dtlsParameters: sendTransportData.dtlsParameters,
        iceServers,
      });

      sendTransportRef.current = sendTransport;

      // Handle send transport events
      sendTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            socket.emit(
              "mediasoup:connectTransport",
              {
                callId: currentCallId,
                transportId: sendTransport.id,
                dtlsParameters,
              },
              (response) => {
                if (response.error) {
                  errback(new Error(response.error));
                } else {
                  callback();
                }
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );

      sendTransport.on(
        "produce",
        async ({ kind, rtpParameters }, callback, errback) => {
          try {
            socket.emit(
              "mediasoup:produce",
              {
                callId: currentCallId,
                transportId: sendTransport.id,
                kind,
                rtpParameters,
              },
              (response) => {
                if (response.error) {
                  errback(new Error(response.error));
                } else {
                  callback({ id: response.producerId });
                }
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );

      // Get user media and produce
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      const producer = await sendTransport.produce({ track });
      producerRef.current = producer;

      // Create receive transport
      const recvTransportData = await new Promise((resolve, reject) => {
        socket.emit(
          "mediasoup:createWebRtcTransport",
          { callId: currentCallId },
          (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.transport);
            }
          }
        );
      });

      const recvTransport = device.createRecvTransport({
        id: recvTransportData.id,
        iceParameters: recvTransportData.iceParameters,
        iceCandidates: recvTransportData.iceCandidates,
        dtlsParameters: recvTransportData.dtlsParameters,
        iceServers,
      });

      recvTransportRef.current = recvTransport;

      recvTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            socket.emit(
              "mediasoup:connectTransport",
              {
                callId: currentCallId,
                transportId: recvTransport.id,
                dtlsParameters,
              },
              (response) => {
                if (response.error) {
                  errback(new Error(response.error));
                } else {
                  callback();
                }
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );

      // Get existing producers and consume them
      const { producers } = await new Promise((resolve, reject) => {
        socket.emit(
          "mediasoup:getProducers",
          { callId: currentCallId },
          (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });

      for (const producerId of producers) {
        await consumeRemoteAudio(producerId);
      }

      // Wait a moment to verify transports are actually connected before setting status
      // Check transport states after a short delay
      setTimeout(() => {
        const sendState = sendTransport.connectionState;
        const recvState = recvTransport.connectionState;
        const sendClosed = sendTransport.closed;
        const recvClosed = recvTransport.closed;

        

        // If transports are closed or failed, connection failed
        if (
          sendClosed ||
          recvClosed ||
          sendState === "failed" ||
          recvState === "failed"
        ) {
          console.error(
            "📞 [SFU] Transports failed or closed after initialization"
          );
          setError(
            "Connection failed. The transports did not establish properly. Please try ending and restarting the call."
          );
          setStatus("error");
          return;
        }

        // Only set connected if both transports are actually connected
        if (sendState === "connected" && recvState === "connected") {
          
          setStatus("connected");
          if (!callStartTimeRef.current) {
            callStartTimeRef.current = Date.now();
            startDurationTimer();
          }
        } else {
          // Still connecting or in intermediate state - keep monitoring
          
          // Don't set status to connected yet - let transport handlers update it
        }
      }, 2000); // Wait 2 seconds to check transport states

      // Don't set status optimistically - wait for verification
      // The timeout check will set status to 'connected' only if transports are actually connected
      // If transports fail, it will set status to 'error'
      // Status will remain 'connecting' until verification completes
    } catch (error) {
      console.error("📞 [SFU] Error initializing SFU:", error);
      throw error;
    }
  };

  const initializeCall = async () => {
    try {
      const module = getModule();
      const currentCallId = callIdRef.current;

      if (!currentCallId) {
        console.warn(
          "📞 [CallPopup] No callId available, cannot initialize call"
        );
        return;
      }

      // Reset fallback flags for new call
      hasAttemptedFallbackRef.current = false;
      isSwitchingToSFURef.current = false;

      // Try to use existing socket first (for patient to ensure same connection)
      let socket = getSocket();
      let isNewSocket = false;

      // Helper function to join call room (returns promise)
      const joinCallRoom = (socketInstance) => {
        return new Promise((resolve) => {
          if (!socketInstance || !currentCallId) {
            console.error(
              "📞 [CallPopup] Cannot join room: missing socket or callId",
              {
                hasSocket: !!socketInstance,
                callId: currentCallId,
              }
            );
            resolve(false);
            return;
          }

          const joinRoomWithTimeout = () => {
            
            

            // Set timeout for room join (5 seconds)
            const timeout = setTimeout(() => {
              console.error(
                "📞 [CallPopup] ⏱️ Room join timeout - no response from server"
              );
              resolve(false);
            }, 5000);

            socketInstance.emit(
              "call:joinRoom",
              { callId: currentCallId },
              (response) => {
                clearTimeout(timeout);

                if (response && response.error) {
                  console.error(
                    "📞 [CallPopup] ❌ Failed to join call room:",
                    response.error
                  );
                  console.error("📞 [CallPopup] Response details:", response);
                  resolve(false);
                } else {
                  
                  

                  // Verify room join by checking socket state
                  // Note: socket.rooms is not available on client, but we trust server response
                  // We can verify by checking if socket is still connected
                  if (socketInstance.connected) {
                    
                    roomJoinedRef.current = true; // Mark as joined

                    // Notify server that we've joined (crucial for P2P signaling triggers)
                    const module = getModule();
                    if (module === "patient") {
                      
                      socketInstance.emit("call:joined", {
                        callId: currentCallId,
                      });
                    }

                    resolve(true);
                  } else {
                    console.warn(
                      "📞 [CallPopup] ⚠️ Socket disconnected after room join"
                    );
                    roomJoinedRef.current = false;
                    resolve(false);
                  }
                }
              }
            );
          };

          if (socketInstance.connected) {
            joinRoomWithTimeout();
          } else {
            // Wait for connection then join
            
            const connectHandler = () => {
              socketInstance.off("connect", connectHandler);
              
              joinRoomWithTimeout();
            };
            socketInstance.once("connect", connectHandler);

            // Also set a timeout for connection wait
            setTimeout(() => {
              if (!socketInstance.connected) {
                console.error("📞 [CallPopup] ⏱️ Socket connection timeout");
                socketInstance.off("connect", connectHandler);
                resolve(false);
              }
            }, 10000); // 10 seconds for connection
          }
        });
      };

      if (!socket || !socket.connected) {
        // Fallback to creating new socket if shared socket not available
        const token =
          getAuthToken(module) ||
          getAuthToken("patient") ||
          getAuthToken("doctor");

        if (!token) {
          setError("Authentication required");
          setStatus("error");
          return;
        }

        
        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ["polling", "websocket"],
        });
        isNewSocket = true;

        // Set up socket event listeners before connect
        const handleDisconnect = (reason) => {
          
          // For P2P, socket disconnect might not be fatal if P2P connection is already established
          // P2P can work even if signaling socket disconnects after connection is established
          if (p2pManagerRef.current && p2pManagerRef.current.peerConnection) {
            const pcState =
              p2pManagerRef.current.peerConnection.connectionState;
            
            if (pcState === "connected" || pcState === "connecting") {
              
              // Don't set error - P2P might still work
              return;
            }
          }
          // Only set error if P2P is not active or failed
          setStatus("error");
          setError("Connection lost");
        };

        const handleCallError = (data) => {
          console.error("📞 [CallPopup] Call error:", data);
          setError(data.message || "Call error occurred");
          setStatus("error");
        };

        // Use unified handler for call:ended
        const handleCallEnded = handleCallEndedUnified;

        // Handle call declined (patient declined before call started)
        const handleCallDeclined = (data) => {
          const currentCallId = callIdRef.current;
          const currentActiveCall = activeCallRef.current;

          
          
          
          

          // Process if we have an active call
          const callIdMatches =
            data && data.callId && data.callId === currentCallId;
          const hasActiveCall = currentActiveCall && currentActiveCall.callId;

          if (!callIdMatches && !hasActiveCall) {
            
            return;
          }

          
          cleanup();
          setStatus("ended");
          setTimeout(() => {
            
            endCall();
          }, 500);
        };

        const handleNewProducer = async (data) => {
          const eventTimestamp = Date.now();
          
          
          
          

          // DIAGNOSTIC: Event flow tracking
          
          const currentSocket = socketRef.current || socket;
          

          // Don't consume if call is ending or ended (but allow if we're switching to SFU)
          if (
            isEndingRef.current ||
            (status === "ended" && !isSwitchingToSFURef.current) ||
            status === "error"
          ) {
            
            
            return;
          }

          if (!data.producerId) {
            console.warn(
              "📞 [CallPopup] New producer event missing producerId"
            );
            console.warn(`🔍 [DIAGNOSTIC] Invalid event data:`, data);
            return;
          }

          // Never consume our own producer
          const isOurOwnProducer =
            producerRef.current && producerRef.current.id === data.producerId;
          if (isOurOwnProducer) {
            
            
            return;
          }

          // DIAGNOSTIC: Timing check - when was our producer created?
          const producerCreatedTime =
            producerRef.current?._createdAt || "unknown";
          

          // Consume the remote producer
          
          const consumeStartTime = Date.now();
          try {
            await consumeRemoteAudio(data.producerId);
            const consumeDuration = Date.now() - consumeStartTime;
            
          } catch (error) {
            console.error(
              "📞 [CallPopup] Error consuming remote audio in handleNewProducer:",
              error
            );
            console.error(
              `🔍 [DIAGNOSTIC] Consumer creation failed after ${
                Date.now() - consumeStartTime
              }ms:`,
              error
            );
          }
        };

        socket.on("disconnect", handleDisconnect);
        socket.on("call:error", handleCallError);
        socket.on("call:ended", handleCallEnded);
        socket.on("call:declined", handleCallDeclined);
        socket.on("mediasoup:newProducer", handleNewProducer);
        socket.on("call:patientJoined", handlePatientJoinedUnified);

        socket.on("connect", async () => {
          
          socketRef.current = socket;

          // Join call room BEFORE starting the call
          
          const roomJoined = await joinCallRoom(socket);
          if (!roomJoined) {
            console.error(
              "📞 [CallPopup] ❌ CRITICAL: Failed to join call room! Cannot proceed with call setup."
            );
            setError("Failed to join call room. Please try again.");
            setStatus("error");
            return; // Don't proceed if room join failed
          } else {
            
          }

          // Store cleanup function after socketRef is set
          if (socketRef.current) {
            socketRef.current._callPopupCleanup = () => {
              socket.off("disconnect", handleDisconnect);
              socket.off("call:error", handleCallError);
              socket.off("call:ended", handleCallEnded);
              socket.off("call:declined", handleCallDeclined);
              socket.off("mediasoup:newProducer", handleNewProducer);
              socket.off("call:patientJoined", handlePatientJoinedUnified);
              // Also cleanup P2P event handlers
              socket.off("p2p:offer");
              socket.off("p2p:answer");
              socket.off("p2p:iceCandidate");
            };
          }

          joinCall();
        });

        // Handle socket disconnect more gracefully for P2P
        socket.on("disconnect", (reason) => {
          
          // Don't immediately set error status - P2P might still work if it was just a transport issue
          if (p2pManagerRef.current) {
            
            // P2P connection might still be active even if socket disconnects
            // Only set error if P2P connection also fails
          } else {
            setStatus("error");
            setError("Connection lost");
          }
        });
      } else {
        
        socketRef.current = socket;

        // Set up socket event listeners for existing socket
        const handleDisconnect = (reason) => {
          
          // For P2P, socket disconnect might not be fatal if P2P connection is already established
          if (p2pManagerRef.current && p2pManagerRef.current.peerConnection) {
            const pcState =
              p2pManagerRef.current.peerConnection.connectionState;
            
            if (pcState === "connected" || pcState === "connecting") {
              
              return; // Don't set error if P2P is still working
            }
          }
          setStatus("error");
          setError("Connection lost");
        };

        const handleCallError = (data) => {
          console.error("📞 [CallPopup] Call error:", data);
          setError(data.message || "Call error occurred");
          setStatus("error");
        };

        // Use unified handler for call:ended
        const handleCallEnded = handleCallEndedUnified;

        // Handle call declined (patient declined before call started)
        const handleCallDeclined = (data) => {
          const currentCallId = callIdRef.current;
          const currentActiveCall = activeCallRef.current;

          
          
          
          

          // Process if we have an active call
          const callIdMatches =
            data && data.callId && data.callId === currentCallId;
          const hasActiveCall = currentActiveCall && currentActiveCall.callId;

          if (!callIdMatches && !hasActiveCall) {
            
            return;
          }

          
          cleanup();
          setStatus("ended");
          setTimeout(() => {
            
            endCall();
          }, 500);
        };

        const handleNewProducer = async (data) => {
          const eventTimestamp = Date.now();
          
          
          
          

          // DIAGNOSTIC: Event flow tracking
          
          const currentSocket = socketRef.current || socket;
          

          // Don't consume if call is ending or ended (but allow if we're switching to SFU)
          if (
            isEndingRef.current ||
            (status === "ended" && !isSwitchingToSFURef.current) ||
            status === "error"
          ) {
            
            
            return;
          }

          if (!data.producerId) {
            console.warn(
              "📞 [CallPopup] New producer event missing producerId"
            );
            console.warn(`🔍 [DIAGNOSTIC] Invalid event data:`, data);
            return;
          }

          // Never consume our own producer
          const isOurOwnProducer =
            producerRef.current && producerRef.current.id === data.producerId;
          if (isOurOwnProducer) {
            
            
            return;
          }

          // DIAGNOSTIC: Timing check - when was our producer created?
          const producerCreatedTime =
            producerRef.current?._createdAt || "unknown";
          

          // Consume the remote producer
          
          const consumeStartTime = Date.now();
          try {
            await consumeRemoteAudio(data.producerId);
            const consumeDuration = Date.now() - consumeStartTime;
            
          } catch (error) {
            console.error(
              "📞 [CallPopup] Error consuming remote audio in handleNewProducer:",
              error
            );
            console.error(
              `🔍 [DIAGNOSTIC] Consumer creation failed after ${
                Date.now() - consumeStartTime
              }ms:`,
              error
            );
          }
        };

        socket.on("disconnect", handleDisconnect);
        socket.on("call:error", handleCallError);
        socket.on("call:ended", handleCallEnded);
        socket.on("call:declined", handleCallDeclined);
        socket.on("mediasoup:newProducer", handleNewProducer);
        socket.on("call:patientJoined", handlePatientJoinedUnified);

        // Store cleanup function for listeners
        if (socketRef.current) {
          socketRef.current._callPopupCleanup = () => {
            socket.off("disconnect", handleDisconnect);
            socket.off("call:error", handleCallError);
            socket.off("call:ended", handleCallEnded);
            socket.off("call:declined", handleCallDeclined);
            socket.off("mediasoup:newProducer", handleNewProducer);
            socket.off("call:patientJoined", handlePatientJoinedUnified);
          };
        }

        // Join call room BEFORE starting the call (for existing socket)
        
        const roomJoined = await joinCallRoom(socket);
        if (!roomJoined) {
          console.error(
            "📞 [CallPopup] ❌ CRITICAL: Failed to join call room! Cannot proceed with call setup."
          );
          setError("Failed to join call room. Please try again.");
          setStatus("error");
          return; // Don't proceed if room join failed
        } else {
          
        }

        // Socket already connected, join call immediately
        joinCall();
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      setError(error.message || "Failed to initialize call");
      setStatus("error");
    }
  };

  const joinCall = async () => {
    try {
      const socket = socketRef.current;
      if (!socket) {
        console.error("📞 [CallPopup] No socket available, cannot join call");
        return;
      }

      const currentCallId = callIdRef.current; // Use ref to get current callId
      if (!currentCallId) {
        console.warn("📞 [CallPopup] No callId available, cannot join call");
        return;
      }

      
      
      
      

      // P2P/SFU Selection Logic
      const shouldUseP2P = useP2P;
      const module = getModule();
      const isInitiator = module === "doctor"; // Doctor initiates the call

      if (shouldUseP2P) {
        
        

        // Initialize P2P manager
        const p2pManager = new P2PCallManager(currentCallId, socket, () => {
          const module = getModule();
          return (
            getAuthToken(module) ||
            getAuthToken("patient") ||
            getAuthToken("doctor")
          );
        });
        p2pManagerRef.current = p2pManager;

        // Set up remote stream handler
        p2pManager.onRemoteStream = (remoteStream) => {
          
          

          if (remoteStream) {
            remoteStream.getTracks().forEach((track, index) => {
              
            });
          }

          const audioElement = remoteAudioRef.current;
          

          if (audioElement && remoteStream) {
            
            audioElement.srcObject = remoteStream;
            audioElement.volume = 1.0;
            audioElement.muted = false;

            

            // Try to play with retry logic
            const playAudio = async (retryCount = 0) => {
              try {
                await audioElement.play();
                
              } catch (err) {
                console.error(
                  `🔗 [P2P] Error playing remote audio (attempt ${
                    retryCount + 1
                  }):`,
                  err
                );
                if (retryCount < 3) {
                  setTimeout(() => playAudio(retryCount + 1), 500);
                } else {
                  console.error(
                    "🔗 [P2P] ❌ Failed to play remote audio after retries"
                  );
                }
              }
            };

            playAudio();
            
          } else {
            if (!audioElement) {
              console.warn(
                "🔗 [P2P] ⚠️ Audio element not available yet, will retry..."
              );
              // Retry after a short delay
              setTimeout(() => {
                const retryElement = remoteAudioRef.current;
                if (retryElement && remoteStream) {
                  
                  retryElement.srcObject = remoteStream;
                  retryElement.volume = 1.0;
                  retryElement.muted = false;
                  retryElement.play().catch((err) => {
                    console.error(
                      "🔗 [P2P] Error playing remote audio on retry:",
                      err
                    );
                  });
                }
              }, 500);
            }
            if (!remoteStream) {
              console.error("🔗 [P2P] ❌ No remote stream provided!");
            }
          }
        };

        // Set up connection state handler with automatic SFU fallback
        p2pManager.onConnectionStateChange = (state) => {
          
          if (state === "connected") {
            setStatus("connected");
            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now();
              startDurationTimer();
            }
            // Reset fallback flag on successful connection
            hasAttemptedFallbackRef.current = false;
          } else if (state === "failed" || state === "disconnected") {
            console.error("🔗 [P2P] Connection failed:", state);

            // Only attempt fallback once and if not already switching
            if (
              !hasAttemptedFallbackRef.current &&
              !isSwitchingToSFURef.current
            ) {
              
              hasAttemptedFallbackRef.current = true;
              switchToSFU();
            } else {
              // If fallback already attempted or in progress, show error
              setError("P2P connection failed. Please try again.");
              setStatus("error");
            }
          }
        };

        // Set up ICE connection state handler for early failure detection
        p2pManager.onIceConnectionStateChange = (iceState) => {
          

          // If ICE fails, attempt fallback (but only if peer connection state hasn't already failed)
          if (
            iceState === "failed" &&
            !hasAttemptedFallbackRef.current &&
            !isSwitchingToSFURef.current
          ) {
            const pcState = p2pManager.peerConnection?.connectionState;
            

            // Wait a bit to see if peer connection state also fails
            setTimeout(() => {
              const currentPcState = p2pManager.peerConnection?.connectionState;
              if (
                currentPcState === "failed" ||
                currentPcState === "disconnected"
              ) {
                if (
                  !hasAttemptedFallbackRef.current &&
                  !isSwitchingToSFURef.current
                ) {
                  
                  hasAttemptedFallbackRef.current = true;
                  switchToSFU();
                }
              }
            }, 2000); // Wait 2 seconds for peer connection to catch up
          }
        };

        // Set up P2P event handlers (store references for cleanup)
        const p2pOfferHandler = async (data) => {
          if (data.callId === currentCallId && !isInitiator) {
            
            try {
              await p2pManager.handleOffer(data.offer);
            } catch (error) {
              console.error("🔗 [P2P] Error handling offer:", error);
            }
          }
        };

        const p2pAnswerHandler = async (data) => {
          if (data.callId === currentCallId && isInitiator) {
            
            try {
              await p2pManager.handleAnswer(data.answer);
            } catch (error) {
              console.error("🔗 [P2P] Error handling answer:", error);
            }
          }
        };

        const p2pIceCandidateHandler = async (data) => {
          if (data.callId === currentCallId && data.candidate !== undefined) {
            
            try {
              await p2pManager.handleIceCandidate(data.candidate);
            } catch (error) {
              // Error is already logged in handleIceCandidate, just log here for context
              const errorMessage =
                error?.message || error?.toString() || "Unknown error";
              console.warn(
                "🔗 [P2P] ICE candidate handler error (may be non-fatal):",
                errorMessage
              );
            }
          }
        };

        socket.on("p2p:offer", p2pOfferHandler);
        socket.on("p2p:answer", p2pAnswerHandler);
        socket.on("p2p:iceCandidate", p2pIceCandidateHandler);

        // Store handlers for cleanup
        socket._p2pHandlers = {
          offer: p2pOfferHandler,
          answer: p2pAnswerHandler,
          iceCandidate: p2pIceCandidateHandler,
        };

        // Initialize P2P connection
        
        const p2pInitialized = await p2pManager.initialize(isInitiator);
        if (!p2pInitialized) {
          console.error("🔗 [P2P] ❌ Failed to initialize P2P connection");

          // Attempt automatic fallback to SFU if not already attempted
          if (
            !hasAttemptedFallbackRef.current &&
            !isSwitchingToSFURef.current
          ) {
            
            hasAttemptedFallbackRef.current = true;
            await switchToSFU();
            return; // Exit, SFU will handle the rest
          } else {
            // If fallback already attempted or in progress, show error
            setError(
              "Failed to initialize P2P connection. Check browser console for details. Make sure microphone permission is granted."
            );
            setStatus("error");
            return;
          }
        }

        
        // Note: Connection state will be set by onConnectionStateChange handler
        // Don't set status here as P2P might still fail during ICE negotiation

        // Set up timeout to automatically fallback to SFU if connection doesn't complete
        // This handles cases where P2P gets stuck in "connecting" state
        p2pConnectionTimeoutRef.current = setTimeout(() => {
          const pcState = p2pManager.peerConnection?.connectionState;
          

          // If still not connected after 15 seconds and not already switching, fallback to SFU
          if (
            pcState !== "connected" &&
            !hasAttemptedFallbackRef.current &&
            !isSwitchingToSFURef.current
          ) {
            
            hasAttemptedFallbackRef.current = true;
            switchToSFU();
          }
        }, 15000); // 15 second timeout

        // Clear timeout if connection succeeds
        const originalOnConnectionStateChange =
          p2pManager.onConnectionStateChange;
        p2pManager.onConnectionStateChange = (state) => {
          if (state === "connected") {
            if (p2pConnectionTimeoutRef.current) {
              clearTimeout(p2pConnectionTimeoutRef.current);
              p2pConnectionTimeoutRef.current = null;
              
            }
          }
          if (originalOnConnectionStateChange) {
            originalOnConnectionStateChange(state);
          }
        };

        return; // Exit early, P2P flow complete
      } else {
        
        // Use the extracted SFU initialization function
        await initializeSFU(socket, currentCallId);
        return;
      }

      const sendTransport = device.createSendTransport({
        id: sendTransportData.id,
        iceParameters: sendTransportData.iceParameters,
        iceCandidates: sendTransportData.iceCandidates,
        dtlsParameters: sendTransportData.dtlsParameters,
        iceServers,
      });

      // DIAGNOSTIC: Monitor send transport connection state
      sendTransport.on("connectstatechange", (state) => {
        
        

        if (state === "failed" || state === "disconnected") {
          console.error(
            `🔍 [DIAGNOSTIC] ⚠️ Send transport connection issue: ${state}`
          );
          console.error(`🔍 [DIAGNOSTIC] Send transport failure details:`, {
            id: sendTransport.id,
            connectionState: sendTransport.connectionState,
            iceState: sendTransport.iceState,
            dtlsState: sendTransport.dtlsState,
            closed: sendTransport.closed,
            iceServers: iceServers,
          });

          // If SFU transport fails, update status to error
          if (!useP2P) {
            
            setError(
              "Connection failed. The send transport did not establish. Please try ending and restarting the call."
            );
            setStatus("error");
          }
        }
      });

      // DIAGNOSTIC: Monitor ICE state changes
      sendTransport.on("icegatheringstatechange", (state) => {
        
      });

      // DIAGNOSTIC: Monitor ICE connection state
      sendTransport.on("iceconnectionstatechange", (state) => {
        
        if (state === "failed" || state === "disconnected") {
          console.error(
            `🔍 [DIAGNOSTIC] ⚠️ Send transport ICE connection issue: ${state}`
          );
        }
      });

      // DIAGNOSTIC: Monitor DTLS state changes
      sendTransport.on("dtlsstatechange", (state) => {
        
        if (state === "failed") {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Send transport DTLS failed`);
        }
      });

      sendTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          
          
          try {
            // Add timeout for transport connection
            const timeout = setTimeout(() => {
              console.error(
                `🔍 [DIAGNOSTIC] ⏱️ Send transport connection timeout (10s)`
              );
              errback(new Error("Transport connection timeout"));
            }, 10000);

            socket.emit(
              "mediasoup:connectTransport",
              {
                transportId: sendTransport.id,
                dtlsParameters,
                callId: currentCallId, // Include callId for verification
              },
              (response) => {
                clearTimeout(timeout);
                if (response && response.error) {
                  console.error(
                    `🔍 [DIAGNOSTIC] ❌ Send transport DTLS connection failed:`,
                    response.error
                  );
                  console.error(`🔍 [DIAGNOSTIC] Server response:`, response);
                  errback(new Error(response.error));
                } else {
                  
                  
                  callback();
                }
              }
            );
          } catch (error) {
            console.error(
              `🔍 [DIAGNOSTIC] Send transport connect error:`,
              error
            );
            console.error(`🔍 [DIAGNOSTIC] Error stack:`, error.stack);
            errback(error);
          }
        }
      );

      // DIAGNOSTIC: Monitor ICE connection state
      if (sendTransport.observer) {
        sendTransport.observer.on("newtransport", (transport) => {
          
        });
      }

      sendTransport.on(
        "produce",
        async ({ kind, rtpParameters }, callback, errback) => {
          try {
            socket.emit(
              "mediasoup:produce",
              {
                transportId: sendTransport.id,
                rtpParameters,
                kind,
              },
              (response) => {
                if (response.error) {
                  errback(new Error(response.error));
                } else {
                  callback({ id: response.producer.id });
                }
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );

      sendTransportRef.current = sendTransport;

      // Create recv transport
      const recvTransportData = await new Promise((resolve, reject) => {
        socket.emit(
          "mediasoup:createWebRtcTransport",
          { callId: currentCallId },
          (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.transport);
            }
          }
        );
      });

      const recvTransport = device.createRecvTransport({
        id: recvTransportData.id,
        iceParameters: recvTransportData.iceParameters,
        iceCandidates: recvTransportData.iceCandidates,
        dtlsParameters: recvTransportData.dtlsParameters,
        iceServers,
      });

      // DIAGNOSTIC: Monitor recv transport connection state
      recvTransport.on("connectstatechange", (state) => {
        
        

        if (state === "failed" || state === "disconnected") {
          console.error(
            `🔍 [DIAGNOSTIC] ⚠️ Recv transport connection issue: ${state}`
          );

          // If SFU transport fails, update status to error
          if (!useP2P && status === "connected") {
            
            setError(
              "Connection lost. Please try ending and restarting the call."
            );
            setStatus("error");
          }
        }
      });

      recvTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          
          try {
            socket.emit(
              "mediasoup:connectTransport",
              {
                transportId: recvTransport.id,
                dtlsParameters,
              },
              (response) => {
                if (response.error) {
                  console.error(
                    `🔍 [DIAGNOSTIC] Recv transport DTLS connection failed:`,
                    response.error
                  );
                  errback(new Error(response.error));
                } else {
                  
                  callback();
                }
              }
            );
          } catch (error) {
            console.error(
              `🔍 [DIAGNOSTIC] Recv transport connect error:`,
              error
            );
            errback(error);
          }
        }
      );

      // DIAGNOSTIC: Log initial transport states
      
      

      // DIAGNOSTIC: Monitor ICE connection state
      const monitorTransportStates = setInterval(() => {
        if (!sendTransportRef.current || !recvTransportRef.current) {
          clearInterval(monitorTransportStates);
          return;
        }

        const sendState = sendTransportRef.current.connectionState;
        const recvState = recvTransportRef.current.connectionState;

        

        // Check for connection issues
        if (sendState === "failed" || sendState === "disconnected") {
          console.error(
            `🔍 [DIAGNOSTIC] ⚠️ Send transport connection issue: ${sendState}`
          );
        }
        if (recvState === "failed" || recvState === "disconnected") {
          console.error(
            `🔍 [DIAGNOSTIC] ⚠️ Recv transport connection issue: ${recvState}`
          );
        }
      }, 5000); // Check every 5 seconds

      // Store interval for cleanup
      if (sendTransportRef.current) {
        sendTransportRef.current._monitorInterval = monitorTransportStates;
      }

      recvTransportRef.current = recvTransport;

      // CRITICAL: Ensure we're in the call room before producing audio
      // This prevents race condition where producer event is emitted before room join completes
      
      if (socket && socket.connected) {
        // Double-check room membership
        const verifyRoomJoin = () => {
          return new Promise((resolve) => {
            socket.emit(
              "call:joinRoom",
              { callId: currentCallId },
              (response) => {
                if (response && response.error) {
                  console.warn(
                    "📞 [CallPopup] Room join verification failed:",
                    response.error
                  );
                  resolve(false);
                } else {
                  
                  resolve(true);
                }
              }
            );
          });
        };

        const roomJoined = await verifyRoomJoin();
        if (!roomJoined) {
          console.warn(
            "📞 [CallPopup] ⚠️ Room join verification failed, but continuing with production"
          );
        }
      } else {
        console.warn(
          "📞 [CallPopup] ⚠️ Socket not available for room verification"
        );
      }

      // Get user media and produce
      await produceLocalAudio();

      // Request existing producers for this call (to handle race condition)
      // This ensures we consume audio from participants who joined before us
      
      try {
        const existingProducersResponse = await new Promise(
          (resolve, reject) => {
            socket.emit(
              "mediasoup:getProducers",
              { callId: currentCallId },
              (response) => {
                if (response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response);
                }
              }
            );
          }
        );

        const existingProducers = existingProducersResponse.producers || [];
        
        

        // Consume all existing producers (from other participants who joined earlier)
        if (existingProducers.length > 0) {
          for (const producer of existingProducers) {
            // Only consume if:
            // 1. Producer has a valid ID
            // 2. It's not our own producer
            // 3. We haven't already consumed it (check consumerRef)
            const isOurProducer = producer.id === producerRef.current?.id;
            const alreadyConsumed =
              consumerRef.current &&
              consumerRef.current.producerId === producer.id;

            if (producer.id && !isOurProducer && !alreadyConsumed) {
              
              try {
                await consumeRemoteAudio(producer.id);
                
              } catch (error) {
                console.error(
                  "📞 [CallPopup] Error consuming existing producer:",
                  producer.id,
                  error
                );
                // Continue with other producers even if one fails
              }
            } else {
              if (isOurProducer) {
                
              } else if (alreadyConsumed) {
                
              } else {
                console.warn(
                  "📞 [CallPopup] Skipping existing producer - invalid ID:",
                  producer
                );
              }
            }
          }
        } else {
          
        }
      } catch (error) {
        console.warn(
          "📞 [CallPopup] Error getting existing producers (non-critical):",
          error
        );
        console.warn(
          "📞 [CallPopup] Will rely on mediasoup:newProducer events for remote audio"
        );
        // Don't fail the call if this fails - we'll still listen for new producers
      }

      setStatus("connected");
      callStartTimeRef.current = Date.now();
      startDurationTimer();

      // Notify server that we've successfully joined the call (for doctor notification)
      // Note: module is already declared at the start of joinCall function
      const currentSocket = socketRef.current;

      if (module === "patient" && currentSocket) {
        // Ensure socket is connected before emitting
        if (currentSocket.connected) {
          
          

          currentSocket.emit(
            "call:joined",
            { callId: currentCallId },
            (response) => {
              if (response) {
                
              }
            }
          );
        } else {
          console.warn(
            "📞 [CallPopup] Socket not connected, waiting for connection before emitting call:joined"
          );
          const connectHandler = () => {
            
            currentSocket.emit("call:joined", { callId: currentCallId });
            currentSocket.off("connect", connectHandler);
          };
          currentSocket.on("connect", connectHandler);
        }
      } else if (module === "patient") {
        console.error("📞 [CallPopup] No socket available to emit call:joined");
      }
    } catch (error) {
      console.error("Error joining call:", error);
      setError(error.message || "Failed to join call");
      setStatus("error");
    }
  };

  const produceLocalAudio = async () => {
    try {
      
      

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        
      }

      if (!sendTransportRef.current) {
        throw new Error("Send transport not available");
      }

      const track = audioTracks[0];
      const params = {
        track,
        codecOptions: {
          opusStereo: true,
          opusFec: true,
          opusDtx: true,
          opusMaxPlaybackRate: 48000,
        },
      };

      
      const producerCreateStartTime = Date.now();
      const producer = await sendTransportRef.current.produce(params);
      const producerCreateDuration = Date.now() - producerCreateStartTime;
      producerRef.current = producer;
      producer._createdAt = producerCreateStartTime; // Store creation time for diagnostics

      
      

      // DIAGNOSTIC: Log producer creation timing
      

      // DIAGNOSTIC: Monitor producer state
      

      // DIAGNOSTIC: Monitor producer events
      producer.on("transportclose", () => {
        console.warn(
          `🔍 [DIAGNOSTIC] ⚠️ Producer transport closed:`,
          producer.id
        );
      });

      // DIAGNOSTIC: Check if producer is actually sending data
      if (producer.track) {
        const checkProducerActivity = setInterval(() => {
          if (producer.closed) {
            clearInterval(checkProducerActivity);
            return;
          }
          
        }, 5000); // Check every 5 seconds

        // Clean up interval on component unmount
        if (producerRef.current) {
          producerRef.current._activityCheckInterval = checkProducerActivity;
        }
      }

      // Note: We'll consume when we receive mediasoup:newProducer event
    } catch (error) {
      console.error("📞 [CallPopup] ❌ Error producing local audio:", error);
      console.error("📞 [CallPopup] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      setError("Failed to access microphone: " + error.message);
      setStatus("error");
    }
  };

  const consumeRemoteAudio = async (producerId) => {
    try {
      
      

      // Don't consume if call is ending or ended (but allow if we're switching to SFU)
      if (
        isEndingRef.current ||
        (status === "ended" && !isSwitchingToSFURef.current) ||
        status === "error"
      ) {
        
        return;
      }

      // Close existing consumer if we're replacing it (for 1-to-1 calls, there should only be one remote producer)
      if (consumerRef.current) {
        
        
        try {
          consumerRef.current.close();
          
        } catch (error) {
          console.warn(
            "📞 [CallPopup] Error closing existing consumer:",
            error
          );
        }
        consumerRef.current = null;
      }

      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;
      const socket = socketRef.current;

      if (!device || !recvTransport || !socket) {
        console.warn(
          "📞 [CallPopup] Cannot consume - missing required components:",
          {
            device: !!device,
            recvTransport: !!recvTransport,
            socket: !!socket,
            status: status,
            isSwitching: isSwitchingToSFURef.current,
          }
        );

        // If we're switching to SFU and components aren't ready yet, wait a bit
        if (isSwitchingToSFURef.current) {
          
          return;
        }
        return;
      }

      const currentCallId = callIdRef.current;
      if (!currentCallId) {
        console.warn("📞 [CallPopup] No callId available, cannot consume");
        return;
      }

      
      
      

      const { consumer } = await new Promise((resolve, reject) => {
        socket.emit(
          "mediasoup:consume",
          {
            transportId: recvTransport.id,
            producerId,
            rtpCapabilities: device.rtpCapabilities,
            callId: currentCallId,
          },
          (response) => {
            if (response.error) {
              console.error(
                "📞 [CallPopup] Server error creating consumer:",
                response.error
              );
              reject(new Error(response.error));
            } else {
              
              resolve(response);
            }
          }
        );
      });

      // Check if recvTransport is still valid before consuming
      if (!recvTransportRef.current || recvTransportRef.current.closed) {
        console.warn(
          "📞 [CallPopup] Receive transport is closed, cannot consume"
        );
        return;
      }

      
      // Create consumer using mediasoup-client
      const consumerInstance = await recvTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      consumerRef.current = consumerInstance;
      

      // DIAGNOSTIC: Monitor consumer state
      

      // DIAGNOSTIC: Monitor consumer events
      consumerInstance.on("transportclose", () => {
        console.warn(
          `🔍 [DIAGNOSTIC] ⚠️ Consumer transport closed:`,
          consumerInstance.id
        );
      });

      consumerInstance.on("producerclose", () => {
        console.warn(
          `🔍 [DIAGNOSTIC] ⚠️ Consumer producer closed:`,
          consumerInstance.producerId
        );
      });

      // Resume consumer on server (consumers are paused by default in mediasoup)
      
      try {
        await new Promise((resolve, reject) => {
          socket.emit(
            "mediasoup:resumeConsumer",
            {
              consumerId: consumerInstance.id,
            },
            (response) => {
              if (response.error) {
                console.error(
                  "📞 [CallPopup] Server error resuming consumer:",
                  response.error
                );
                reject(new Error(response.error));
              } else {
                

                // DIAGNOSTIC: Verify consumer is actually resumed
                

                resolve(response);
              }
            }
          );
        });
      } catch (error) {
        console.error("📞 [CallPopup] ❌ Error resuming consumer:", error);
        console.error(
          `🔍 [DIAGNOSTIC] Consumer resume failed - consumer may be paused!`
        );
        // Don't fail the call if resume fails - try to continue anyway
      }

      // Ensure the track is enabled
      if (consumerInstance.track) {
        consumerInstance.track.enabled = true;
        
      } else {
        console.error("📞 [CallPopup] ❌ Consumer instance has no track!");
      }

      // Wait for audio element to be ready and set up remote audio playback
      
      const setupAudioElement = (retryCount = 0) => {
        const maxRetries = 20; // Increased retries
        const audioElement = remoteAudioRef.current;

        // Check if audio element exists and is in the DOM
        if (!audioElement) {
          if (retryCount < maxRetries) {
            console.warn(
              `📞 [CallPopup] Audio element not available, retrying... (${
                retryCount + 1
              }/${maxRetries})`
            );
            // Use requestAnimationFrame for better timing with DOM updates
            requestAnimationFrame(() => {
              setTimeout(() => {
                setupAudioElement(retryCount + 1);
              }, 50);
            });
            return;
          } else {
            console.error(
              "📞 [CallPopup] ❌ Audio element still not available after",
              maxRetries,
              "retries"
            );
            return;
          }
        }

        // Verify the element is actually in the DOM
        if (
          !audioElement.ownerDocument ||
          !audioElement.ownerDocument.body.contains(audioElement)
        ) {
          if (retryCount < maxRetries) {
            console.warn(
              `📞 [CallPopup] Audio element not in DOM, retrying... (${
                retryCount + 1
              }/${maxRetries})`
            );
            requestAnimationFrame(() => {
              setTimeout(() => {
                setupAudioElement(retryCount + 1);
              }, 50);
            });
            return;
          } else {
            console.error(
              "📞 [CallPopup] ❌ Audio element not in DOM after",
              maxRetries,
              "retries"
            );
            return;
          }
        }

        

        // DIAGNOSTIC: Check audio element initial state
        

        // Verify consumer track exists and is valid
        if (!consumerInstance.track) {
          console.error("📞 [CallPopup] ❌ Consumer instance has no track!");
          return;
        }

        // Create audio element for remote audio
        const stream = new MediaStream([consumerInstance.track]);
        

        // DIAGNOSTIC: Check MediaStream state
        

        // Clear any existing srcObject first
        if (audioElement.srcObject) {
          
          const oldStream = audioElement.srcObject;
          oldStream.getTracks().forEach((track) => track.stop());
          audioElement.srcObject = null;
        }

        // Set up audio element properties
        try {
          audioElement.srcObject = stream;
          audioElement.volume = 1.0; // Ensure volume is at maximum
          audioElement.muted = false; // Ensure not muted

          // Force a re-check to ensure srcObject was set
          if (!audioElement.srcObject) {
            console.error(
              "📞 [CallPopup] ❌ Failed to set srcObject on audio element!"
            );
            // Try again after a brief delay
            setTimeout(() => {
              if (remoteAudioRef.current && consumerInstance.track) {
                
                remoteAudioRef.current.srcObject = new MediaStream([
                  consumerInstance.track,
                ]);
                remoteAudioRef.current.volume = 1.0;
                remoteAudioRef.current.muted = false;
              }
            }, 100);
            return;
          }
        } catch (error) {
          console.error(
            "📞 [CallPopup] ❌ Error setting audio element srcObject:",
            error
          );
          return;
        }

        

        // DIAGNOSTIC: Verify audio element configuration immediately after setting
        setTimeout(() => {
          const verifyElement = remoteAudioRef.current;
          if (verifyElement) {
            
          }
        }, 100);

        // Add event listeners for debugging
        const onLoadedMetadata = () => {
          
        };

        const onCanPlay = () => {
          
        };

        const onPlay = () => {
          
        };

        const onError = (e) => {
          console.error("📞 [CallPopup] ❌ Audio element error:", e);
          console.error("📞 [CallPopup] Error details:", {
            error: audioElement.error,
            code: audioElement.error?.code,
            message: audioElement.error?.message,
          });
          console.error(`🔍 [DIAGNOSTIC] Audio element error state:`, {
            paused: audioElement.paused,
            muted: audioElement.muted,
            volume: audioElement.volume,
            readyState: audioElement.readyState,
            srcObject: !!audioElement.srcObject,
            error: audioElement.error,
          });
        };

        const onStalled = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element stalled`);
        };

        const onWaiting = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element waiting for data`);
        };

        const onSuspend = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element suspended`);
        };

        audioElement.addEventListener("loadedmetadata", onLoadedMetadata);
        audioElement.addEventListener("canplay", onCanPlay);
        audioElement.addEventListener("play", onPlay);
        audioElement.addEventListener("error", onError);
        audioElement.addEventListener("stalled", onStalled);
        audioElement.addEventListener("waiting", onWaiting);
        audioElement.addEventListener("suspend", onSuspend);

        // DIAGNOSTIC: Monitor audio element state periodically
        const monitorAudioElement = setInterval(() => {
          if (!audioElement || audioElement.ended) {
            clearInterval(monitorAudioElement);
            return;
          }
          
        }, 5000); // Check every 5 seconds

        // Store interval for cleanup
        if (remoteAudioRef.current) {
          remoteAudioRef.current._monitorInterval = monitorAudioElement;
        }

        // Play the audio with retry logic
        const playAudio = async (playRetryCount = 0) => {
          const maxPlayRetries = 3;
          try {
            
            await audioElement.play();
            
          } catch (playError) {
            console.warn(
              "📞 [CallPopup] Initial play() failed:",
              playError.name,
              playError.message
            );
            if (playRetryCount < maxPlayRetries) {
              // Retry after a short delay
              
              setTimeout(async () => {
                try {
                  await audioElement.play();
                  
                } catch (retryError) {
                  console.error(
                    "📞 [CallPopup] ❌ Failed to play remote audio after retry:",
                    retryError
                  );
                  // Some browsers require user interaction - log but don't fail
                  if (retryError.name === "NotAllowedError") {
                    console.warn(
                      "📞 [CallPopup] Browser blocked autoplay - user interaction may be required"
                    );
                  } else {
                    // Try one more time if not a permission error
                    if (playRetryCount < maxPlayRetries - 1) {
                      playAudio(playRetryCount + 1);
                    }
                  }
                }
              }, 200 * (playRetryCount + 1)); // Exponential backoff
            } else {
              console.error(
                "📞 [CallPopup] ❌ Failed to play remote audio after",
                maxPlayRetries,
                "retries"
              );
              if (playError.name === "NotAllowedError") {
                console.warn(
                  "📞 [CallPopup] Browser blocked autoplay - user interaction may be required"
                );
              }
            }
          }
        };

        playAudio();
      };

      // Setup audio element (with retry if not ready)
      setupAudioElement();

      
    } catch (error) {
      // Check if error is due to call being ended or transport/router being closed
      const errorMessage = error.message || error.toString();
      const isCallEndedError =
        errorMessage.includes("Router not found") ||
        (errorMessage.includes("Transport") &&
          errorMessage.includes("closed")) ||
        (errorMessage.includes("call") && errorMessage.includes("ended"));

      if (isCallEndedError) {
        // Call was likely ended, this is expected - don't log as error
        
      } else {
        // Other errors should be logged
        console.error("📞 [CallPopup] Error consuming remote audio:", error);
      }
    }
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - callStartTimeRef.current) / 1000
        );
        setCallDuration(elapsed);
      }
    }, 1000);
  };

  const handleMuteToggle = () => {
    // Handle P2P mute
    if (p2pManagerRef.current) {
      const newMutedState = !isMuted;
      p2pManagerRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);

      // Notify DoctorCallStatus of mute state change
      const event = new CustomEvent("call:muteStateUpdate", {
        detail: { muted: newMutedState },
      });
      window.dispatchEvent(event);
      return;
    }

    // Handle SFU mute
    if (producerRef.current) {
      const newMutedState = !isMuted;
      if (newMutedState) {
        producerRef.current.pause();
      } else {
        producerRef.current.resume();
      }
      setIsMuted(newMutedState);

      // Notify DoctorCallStatus of mute state change
      const event = new CustomEvent("call:muteStateUpdate", {
        detail: { muted: newMutedState },
      });
      window.dispatchEvent(event);
    }
  };

  // Listen for mute toggle events from DoctorCallStatus
  useEffect(() => {
    const handleMuteToggleEvent = (event) => {
      const { muted } = event.detail;
      if (producerRef.current) {
        if (muted) {
          producerRef.current.pause();
        } else {
          producerRef.current.resume();
        }
        setIsMuted(muted);
      }
    };

    window.addEventListener("call:muteToggle", handleMuteToggleEvent);
    return () => {
      window.removeEventListener("call:muteToggle", handleMuteToggleEvent);
    };
  }, [isMuted]);

  // Backup mechanism: Ensure audio element has srcObject when consumer is ready
  // This runs periodically to catch cases where the initial setup might have failed
  useEffect(() => {
    if (status !== "connecting" && status !== "connected") {
      return;
    }

    const checkAndSetupAudio = () => {
      const consumer = consumerRef.current;
      const audioElement = remoteAudioRef.current;

      if (!consumer || !audioElement || !consumer.track) {
        return;
      }

      // Check if audio element needs srcObject
      if (!audioElement.srcObject) {
        

        try {
          const stream = new MediaStream([consumer.track]);
          audioElement.srcObject = stream;
          audioElement.volume = 1.0;
          audioElement.muted = false;

          

          // Verify it was set
          setTimeout(() => {
            if (audioElement.srcObject) {
              
              // Try to play
              audioElement.play().catch((error) => {
                console.warn(
                  "📞 [CallPopup] [Backup] Play failed (may need user interaction):",
                  error.name
                );
              });
            } else {
              console.warn(
                "📞 [CallPopup] [Backup] ⚠️ srcObject was not set successfully"
              );
            }
          }, 50);
        } catch (error) {
          console.error(
            "📞 [CallPopup] [Backup] Error setting srcObject:",
            error
          );
        }
      }
    };

    // Check immediately
    checkAndSetupAudio();

    // Also check periodically as a backup (every 500ms for first 5 seconds)
    const interval = setInterval(() => {
      checkAndSetupAudio();
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Re-run when status changes (intentionally not including refs in deps)

  const handleEndCall = async (emitToServer = true) => {
    // Prevent duplicate call end
    if (isEndingRef.current) {
      
      return;
    }
    isEndingRef.current = true;

    // Ensure emitToServer is a boolean (in case event object was passed)
    const shouldEmitToServer =
      typeof emitToServer === "boolean" ? emitToServer : true;

    const currentCallId = callIdRef.current; // Use ref to get current callId
    
    
    

    try {
      const socket = socketRef.current;
      // Only emit to server if we're the one initiating the end
      // If emitToServer is false, it means the call was ended by the other party
      if (socket && shouldEmitToServer && currentCallId) {
        
        socket.emit("call:end", { callId: currentCallId }, (response) => {
          if (response) {
            
          }
        });
      } else {
        
      }
    } catch (error) {
      console.error("📞 [CallPopup] Error ending call:", error);
    } finally {
      
      cleanup();
      setStatus("ended");
      // Close the call UI immediately (reduced from 2000ms to 500ms for faster response)
      setTimeout(() => {
        
        endCall(); // Use context to close call
        isEndingRef.current = false; // Reset for next call
      }, 500); // Reduced delay for faster UI response
    }
  };

  const cleanup = () => {
    
    isEndingRef.current = true;
    roomJoinedRef.current = false; // Reset room join status

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Clear P2P connection timeout
    if (p2pConnectionTimeoutRef.current) {
      clearTimeout(p2pConnectionTimeoutRef.current);
      p2pConnectionTimeoutRef.current = null;
    }

    // Cleanup P2P connection
    if (p2pManagerRef.current) {
      
      p2pManagerRef.current.cleanup();
      p2pManagerRef.current = null;

      // Remove P2P event listeners
      const socket = socketRef.current;
      if (socket) {
        socket.off("p2p:offer");
        socket.off("p2p:answer");
        socket.off("p2p:iceCandidate");
      }
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close producer (SFU)
    if (producerRef.current) {
      producerRef.current.close();
      producerRef.current = null;
    }

    // Close consumer (SFU)
    if (consumerRef.current) {
      consumerRef.current.close();
      consumerRef.current = null;
    }

    // Close transports (SFU)
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }

    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    // Clean up socket listeners and disconnect if it was created by CallPopup
    if (socketRef.current) {
      // Clean up event listeners
      try {
        if (
          socketRef.current._callPopupCleanup &&
          typeof socketRef.current._callPopupCleanup === "function"
        ) {
          socketRef.current._callPopupCleanup();
          delete socketRef.current._callPopupCleanup;
        }
      } catch (error) {
        console.warn("Error cleaning up socket listeners:", error);
      }

      try {
        const currentCallId = callIdRef.current;
        if (currentCallId) {
          socketRef.current.emit("call:leave", { callId: currentCallId });
        }
      } catch (error) {
        console.warn("Error emitting call:leave:", error);
      }

      // Only disconnect if this is not the shared socket
      const sharedSocket = getSocket();
      if (socketRef.current !== sharedSocket) {
        try {
          socketRef.current.disconnect();
        } catch (error) {
          console.warn("Error disconnecting socket:", error);
        }
      }

      socketRef.current = null;
    }
  };

  // Don't render if no active call
  if (!activeCall || !callId) {
    return null;
  }

  // Audio element must always be rendered to keep audio playing (even when minimized)
  // Render it before any conditional returns
  const audioElement = (
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
      volume={1.0}
      style={{ display: "none" }}
    />
  );

  if (status === "error") {
    return (
      <>
        {audioElement}
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Call Error
            </h2>
            <p className="text-slate-600 mb-4">
              {error || "An error occurred"}
            </p>
            <button
              onClick={() => endCall()}
              className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition">
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  if (status === "ended") {
    return (
      <>
        {audioElement}
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Call Ended
            </h2>
            <p className="text-slate-600">
              Duration: {formatCallDuration(callDuration)}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Minimized view - floating button (for doctors)
  if (isMinimized && getModule() === "doctor") {
    return (
      <>
        {audioElement}
        <div className="fixed bottom-6 right-6 z-[10000]">
          <button
            onClick={maximize}
            className="relative flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition active:scale-95"
            title="Click to expand call">
            {/* Pulsing animation */}
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <IoCallOutline className="text-white text-2xl relative z-10" />

            {/* Duration badge */}
            {status === "connected" && callDuration > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {formatCallDuration(callDuration).split(":")[1]}
              </span>
            )}
          </button>
        </div>
      </>
    );
  }

  // DIAGNOSTIC: Get current diagnostic state
  const getDiagnosticState = () => {
    return {
      callId: callIdRef.current,
      status: status,
      socket: socketRef.current
        ? {
            id: socketRef.current.id,
            connected: socketRef.current.connected,
            roomJoined: roomJoinedRef.current, // Track room join status (socket.rooms not available on client)
            // Note: socket.rooms is server-side only, we track join status via roomJoinedRef
          }
        : null,
      sendTransport: sendTransportRef.current
        ? {
            id: sendTransportRef.current.id,
            connectionState: sendTransportRef.current.connectionState,
            closed: sendTransportRef.current.closed,
          }
        : null,
      recvTransport: recvTransportRef.current
        ? {
            id: recvTransportRef.current.id,
            connectionState: recvTransportRef.current.connectionState,
            closed: recvTransportRef.current.closed,
          }
        : null,
      producer: producerRef.current
        ? {
            id: producerRef.current.id,
            paused: producerRef.current.paused,
            closed: producerRef.current.closed,
            track: producerRef.current.track
              ? {
                  enabled: producerRef.current.track.enabled,
                  muted: producerRef.current.track.muted,
                  readyState: producerRef.current.track.readyState,
                }
              : null,
          }
        : null,
      consumer: consumerRef.current
        ? {
            id: consumerRef.current.id,
            producerId: consumerRef.current.producerId,
            paused: consumerRef.current.paused,
            closed: consumerRef.current.closed,
            track: consumerRef.current.track
              ? {
                  enabled: consumerRef.current.track.enabled,
                  muted: consumerRef.current.track.muted,
                  readyState: consumerRef.current.track.readyState,
                }
              : null,
          }
        : null,
      audioElement: remoteAudioRef.current
        ? {
            paused: remoteAudioRef.current.paused,
            muted: remoteAudioRef.current.muted,
            volume: remoteAudioRef.current.volume,
            readyState: remoteAudioRef.current.readyState,
            srcObject: !!remoteAudioRef.current.srcObject,
            error: remoteAudioRef.current.error,
          }
        : null,
    };
  };

  return (
    <>
      {audioElement}
      <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
          {/* Minimize button (for doctors) */}
          {getModule() === "doctor" && (
            <button
              onClick={minimize}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 rounded p-1 transition"
              title="Minimize">
              <IoRemoveOutline className="text-xl" />
            </button>
          )}

          {/* Diagnostic Toggle Button */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="absolute top-4 left-4 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition"
            title="Toggle Diagnostics">
            🔍 {showDiagnostics ? "Hide" : "Show"} Diagnostics
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <IoCallOutline className="text-3xl text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Audio Call
            </h2>
            <p className="text-slate-600 text-sm">{remoteParticipant}</p>
            {status === "connected" && (
              <p className="text-slate-500 text-xs mt-2">
                {formatCallDuration(callDuration)}
              </p>
            )}
            {status === "connecting" && (
              <p className="text-slate-500 text-xs mt-2">Connecting...</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handleMuteToggle}
              disabled={status !== "connected"}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                isMuted
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? (
                <IoMicOffOutline className="text-2xl" />
              ) : (
                <IoMicOutline className="text-2xl" />
              )}
            </button>

            <button
              onClick={() => handleEndCall(true)}
              disabled={status === "ended"}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="End Call">
              <IoCloseOutline className="text-3xl" />
            </button>
          </div>

          {/* Status indicator */}
          <div className="mt-6 text-center">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                status === "connected"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "connected"
                    ? "bg-green-500"
                    : "bg-yellow-500 animate-pulse"
                }`}></div>
              {status === "connected" ? "Connected" : "Connecting..."}
            </div>
          </div>

          {/* Diagnostic Panel */}
          {showDiagnostics && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                🔍 Diagnostic Information
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>Call ID:</strong> {callIdRef.current || "N/A"}
                </div>
                <div>
                  <strong>Status:</strong> {status}
                </div>

                {socketRef.current && (
                  <div className="mt-2">
                    <strong>Socket:</strong>
                    <div className="ml-2 text-slate-600">
                      ID: {socketRef.current.id}
                      <br />
                      Connected: {socketRef.current.connected ? "✅" : "❌"}
                      <br />
                      Room Joined: {roomJoinedRef.current ? "✅ Yes" : "❌ No"}
                    </div>
                  </div>
                )}

                {sendTransportRef.current && (
                  <div className="mt-2">
                    <strong>Send Transport:</strong>
                    <div className="ml-2 text-slate-600">
                      ID: {sendTransportRef.current.id}
                      <br />
                      State:{" "}
                      <span
                        className={
                          sendTransportRef.current.connectionState ===
                          "connected"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }>
                        {sendTransportRef.current.connectionState}
                      </span>
                      <br />
                      Closed: {sendTransportRef.current.closed ? "❌" : "✅"}
                    </div>
                  </div>
                )}

                {recvTransportRef.current && (
                  <div className="mt-2">
                    <strong>Recv Transport:</strong>
                    <div className="ml-2 text-slate-600">
                      ID: {recvTransportRef.current.id}
                      <br />
                      State:{" "}
                      <span
                        className={
                          recvTransportRef.current.connectionState ===
                          "connected"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }>
                        {recvTransportRef.current.connectionState}
                      </span>
                      <br />
                      Closed: {recvTransportRef.current.closed ? "❌" : "✅"}
                    </div>
                  </div>
                )}

                {producerRef.current && (
                  <div className="mt-2">
                    <strong>Producer:</strong>
                    <div className="ml-2 text-slate-600">
                      ID: {producerRef.current.id}
                      <br />
                      Paused: {producerRef.current.paused ? "⏸️" : "▶️"}
                      <br />
                      Closed: {producerRef.current.closed ? "❌" : "✅"}
                      <br />
                      {producerRef.current.track && (
                        <>
                          Track Enabled:{" "}
                          {producerRef.current.track.enabled ? "✅" : "❌"}
                          <br />
                          Track Muted:{" "}
                          {producerRef.current.track.muted ? "🔇" : "🔊"}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {consumerRef.current && (
                  <div className="mt-2">
                    <strong>Consumer:</strong>
                    <div className="ml-2 text-slate-600">
                      ID: {consumerRef.current.id}
                      <br />
                      Producer ID: {consumerRef.current.producerId}
                      <br />
                      Paused: {consumerRef.current.paused ? "⏸️" : "▶️"}
                      <br />
                      Closed: {consumerRef.current.closed ? "❌" : "✅"}
                      <br />
                      {consumerRef.current.track && (
                        <>
                          Track Enabled:{" "}
                          {consumerRef.current.track.enabled ? "✅" : "❌"}
                          <br />
                          Track Muted:{" "}
                          {consumerRef.current.track.muted ? "🔇" : "🔊"}
                          <br />
                          Track State: {consumerRef.current.track.readyState}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {remoteAudioRef.current && (
                  <div className="mt-2">
                    <strong>Audio Element:</strong>
                    <div className="ml-2 text-slate-600">
                      Paused: {remoteAudioRef.current.paused ? "⏸️" : "▶️"}
                      <br />
                      Muted: {remoteAudioRef.current.muted ? "🔇" : "🔊"}
                      <br />
                      Volume: {remoteAudioRef.current.volume}
                      <br />
                      Ready State: {remoteAudioRef.current.readyState}
                      <br />
                      Has Source:{" "}
                      {remoteAudioRef.current.srcObject ? "✅" : "❌"}
                      <br />
                      {remoteAudioRef.current.error && (
                        <span className="text-red-600">
                          Error: {remoteAudioRef.current.error.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  <em>
                    Check browser console (F12) for detailed diagnostic logs
                  </em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CallPopup;
