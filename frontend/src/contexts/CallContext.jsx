import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null); // { callId, remoteParticipant }
  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'started' | 'ended'
  const [isMinimized, setIsMinimized] = useState(false);
  const [callInfo, setCallInfo] = useState(null); // { callId, patientName, appointmentId, startTime }

  // Load minimized state from localStorage
  useEffect(() => {
    const savedMinimized = localStorage.getItem("doctorCallMinimized");
    if (savedMinimized !== null) {
      setIsMinimized(savedMinimized === "true");
    }
  }, []);

  const startCall = useCallback((callId, remoteParticipant = "Participant") => {
    
    setActiveCall({ callId, remoteParticipant });
  }, []);

  const endCall = useCallback(() => {
    
    setActiveCall(null);
    setCallStatus("idle");
    setCallInfo(null);
    setIsMinimized(false);
    localStorage.removeItem("doctorCallMinimized");

    // Emit window event as fallback for components that might not be listening to context
    window.dispatchEvent(
      new CustomEvent("call:forceEnd", { detail: { timestamp: Date.now() } })
    );
  }, []);

  const updateCallStatus = useCallback((status) => {
    
    setCallStatus(status);
  }, []);

  const updateCallInfo = useCallback((info) => {
    
    if (typeof info === "function") {
      // Support function updates like setState
      setCallInfo((prev) => {
        const result = info(prev);
        
        return result;
      });
    } else {
      // Support object updates
      setCallInfo((prev) => {
        const result = { ...prev, ...info };
        
        return result;
      });
    }
  }, []);

  const setCallInfoFull = useCallback((info) => {
    
    if (typeof info === "function") {
      // Support function updates like setState
      setCallInfo((prev) => {
        const result = info(prev);
        
        return result;
      });
    } else {
      // Support object updates
      
      setCallInfo(info);
    }
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      const newValue = !prev;
      localStorage.setItem("doctorCallMinimized", String(newValue));
      return newValue;
    });
  }, []);

  const minimize = useCallback(() => {
    setIsMinimized(true);
    localStorage.setItem("doctorCallMinimized", "true");
  }, []);

  const maximize = useCallback(() => {
    setIsMinimized(false);
    localStorage.setItem("doctorCallMinimized", "false");
  }, []);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        startCall,
        endCall,
        callStatus,
        updateCallStatus,
        callInfo,
        updateCallInfo,
        setCallInfoFull,
        isMinimized,
        toggleMinimize,
        minimize,
        maximize,
      }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
};
