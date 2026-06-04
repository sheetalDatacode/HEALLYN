import React from 'react'
import {
  IoCalendarOutline,
  IoPlayOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from 'react-icons/io5'

const SessionStatusCard = (props) => {
  const {
    currentSession,
    getSessionStatusColor,
    getSessionStatusText,
    getAverageConsultationMinutes,
    appointments,
    handleStartSession,
    handleEndSession,
    setShowCancelSessionModal,
    loadingSession,
    filteredAppointments,
    formatTime,
    getAppointmentButtons,
    handleCallNext,
    handleVideoCall,
    handleAudioCall,
    handleRecall,
    handleSkip,
    handleNoShow,
    handleComplete,
    handleViewHistory
  } = props;

  return (
    <>
          {/* Session Status Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
                  <h3 className="text-sm font-bold text-slate-900">Today's Session</h3>
                </div>
                {currentSession ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSessionStatusColor(currentSession.status)}`}>
                        {getSessionStatusText(currentSession.status)}
                      </span>
                      <span className="text-xs text-slate-600">
                        {currentSession?.date && currentSession?.startTime && currentSession?.endTime
                          ? (() => {
                              // Helper to convert time to 12-hour format if needed
                              const formatTime12Hour = (time) => {
                                if (!time) return 'N/A'
                                // If already in 12-hour format (contains AM/PM), return as is
                                if (time.toString().includes('AM') || time.toString().includes('PM')) {
                                  return time
                                }
                                // Convert 24-hour to 12-hour
                                const [hours, minutes] = time.split(':').map(Number)
                                if (isNaN(hours) || isNaN(minutes)) return time
                                const period = hours >= 12 ? 'PM' : 'AM'
                                const hours12 = hours % 12 || 12
                                return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
                              }
                              return `${formatTime12Hour(currentSession.startTime)} - ${formatTime12Hour(currentSession.endTime)}`
                            })()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Avg Time: {currentSession?.averageConsultationMinutes || getAverageConsultationMinutes()} min/patient</span>
                      <span>•</span>
                      <span>Capacity: {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show').length} / {currentSession?.maxTokens || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No session scheduled for today</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {currentSession && (
                  <>
                    {/* Show Start Session button when status is scheduled - ALWAYS visible during session time */}
                    {(() => {
                      // Normalize status to lowercase for comparison
                      const normalizedStatus = String(currentSession.status || 'scheduled').toLowerCase().trim()
                      
                      // Show start button ONLY if status is scheduled (not active/live/completed/cancelled)
                      const isScheduled = normalizedStatus === 'scheduled'
                      const isActiveOrLive = normalizedStatus === 'active' || normalizedStatus === 'live'
                      
                      
                      
                      // Don't show start button if session is already active/live (will show end button instead)
                      if (isActiveOrLive) {
                        
                        return null
                      }
                      
                      // Only show start button for scheduled status
                      if (!isScheduled) {
                        
                        return null
                      }
                      
                      const sessionStartTime = currentSession.startTime || currentSession.sessionStartTime
                      const sessionEndTime = currentSession.endTime || currentSession.sessionEndTime
                      
                      
                      
                      // Button is ALWAYS enabled when status is scheduled
                      // Backend will validate time when clicked and show error if outside session time
                      // Once clicked and session starts successfully, status changes to 'live' and session will auto-end at scheduled end time
                      return (
                      <button
                        type="button"
                        onClick={handleStartSession}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                          title={`Start session (${sessionStartTime} - ${sessionEndTime})`}
                      >
                        <IoPlayOutline className="h-4 w-4" />
                          Start Session
                      </button>
                      )
                    })()}
                    {/* Show End Session button when session is active/live */}
                    {(currentSession.status === 'active' || currentSession.status === 'live') && (
                      <button
                        type="button"
                        onClick={handleEndSession}
                        disabled={loadingSession}
                        className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        {loadingSession ? 'Ending...' : 'End Session'}
                      </button>
                    )}
                    {/* Show Cancel Session button for scheduled/active/live sessions */}
                    {(currentSession.status === 'scheduled' || currentSession.status === 'active' || currentSession.status === 'live') && (
                      <button
                        type="button"
                        onClick={() => setShowCancelSessionModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 active:scale-95"
                      >
                        <IoCloseCircleOutline className="h-4 w-4" />
                        Cancel Session
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
    </>
  );
};

export default SessionStatusCard;
