import React from 'react'
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoVideocamOutline,
  IoCallOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoDocumentTextOutline
} from 'react-icons/io5'

const AppointmentQueue = (props) => {
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
          {/* Appointment Queue */}
          <div className="space-y-3">
            {!currentSession ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No session available</p>
                <p className="mt-1 text-xs text-slate-500">A session will be created when you book an appointment or manually create one</p>
                {loadingSession && (
                  <p className="mt-2 text-xs text-slate-400">Loading session...</p>
                )}
              </div>
            ) : currentSession.status !== 'active' && currentSession.status !== 'live' && currentSession.status !== 'scheduled' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">Session not started</p>
                <p className="mt-1 text-xs text-slate-500">Click "Start Session" to begin and view appointments</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No appointments found</p>
                <p className="mt-1 text-xs text-slate-500">Your appointment queue will appear here</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-xl border bg-white p-3 shadow-sm transition-all ${
                    appointment.status === 'called' || appointment.status === 'in-consultation'
                      ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]'
                      : appointment.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : appointment.status === 'no-show'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Queue Number, Profile Image, Patient Info, Time */}
                    <div className="flex items-start gap-2.5">
                      {/* Queue Number - Smaller */}
                      <div className="flex shrink-0 items-center justify-center">
                        <span
                          className={`text-xs font-semibold ${
                            appointment.status === 'called' || appointment.status === 'in-consultation'
                              ? 'text-[#11496c]'
                              : appointment.status === 'completed'
                              ? 'text-emerald-700'
                              : appointment.status === 'no-show'
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {appointment.queueNumber}.
                        </span>
                      </div>

                      {/* Profile Image - Side */}
                      <img
                        src={appointment.patientImage}
                        alt={appointment.patientName}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                        }}
                      />

                      {/* Patient Info - Full Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {appointment.patientName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {appointment.age || 0} years • {(appointment.gender && typeof appointment.gender === 'string' && appointment.gender.length > 0) ? appointment.gender.charAt(0).toUpperCase() : 'N/A'}
                        </p>
                      </div>

                      {/* Time - Right Side */}
                      <div className="flex shrink-0 items-center">
                        <div className="text-xs font-medium text-slate-700">
                          {appointment.time || appointment.originalData?.time || formatTime(appointment.appointmentTime)}
                        </div>
                      </div>
                    </div>

                    {/* Appointment Type Badge, Consultation Mode, and Status Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.appointmentType === 'New'
                            ? 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {appointment.appointmentType === 'New' ? 'New' : 'Follow up'}
                      </span>
                      {/* Consultation Mode Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.consultationMode === 'in_person'
                            ? 'bg-blue-100 text-blue-700'
                            : appointment.consultationMode === 'video_call'
                            ? 'bg-purple-100 text-purple-700'
                            : appointment.consultationMode === 'call'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {appointment.consultationMode === 'in_person' ? (
                          <>
                            <IoPersonOutline className="h-2.5 w-2.5" />
                            <span>In-Person</span>
                          </>
                        ) : appointment.consultationMode === 'video_call' ? (
                          <>
                            <IoVideocamOutline className="h-2.5 w-2.5" />
                            <span>Video Call</span>
                          </>
                        ) : appointment.consultationMode === 'call' ? (
                          <>
                            <IoCallOutline className="h-2.5 w-2.5" />
                            <span>Call</span>
                          </>
                        ) : (
                          <span>In-Person</span>
                        )}
                      </span>
                      {/* Status Badge - Show Cancelled for no-show/cancelled-by-session, Completed for completed */}
                      {(() => {
                        const status = appointment.status || appointment.originalData?.status
                        const queueStatus = appointment.queueStatus || appointment.originalData?.queueStatus
                        
                        if (status === 'cancelled_by_session' || status === 'cancelled' || queueStatus === 'no-show') {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              <IoCloseCircleOutline className="h-2.5 w-2.5" />
                              Cancelled
                            </span>
                          )
                        }
                        if (status === 'completed') {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <IoCheckmarkCircleOutline className="h-2.5 w-2.5" />
                              Completed
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>

                    {/* Action Buttons - Use helper function to determine button visibility */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {(() => {
                        const buttonConfig = getAppointmentButtons(appointment, currentSession?.status)
                        
                        // If no buttons should be shown (completed/cancelled), return early
                        if (!buttonConfig.showButtons) {
                          return null
                        }

                        const { buttons, consultationMode } = buttonConfig
                        const appointmentId = appointment.id || appointment._id
                        
                        // Get consultationMode from multiple sources for reliability
                        const actualConsultationMode = consultationMode || appointment.consultationMode || appointment.originalData?.consultationMode || 'in_person'
                        const isCallMode = actualConsultationMode && actualConsultationMode.toLowerCase() === 'call'

                        // Debug log to check button configuration
                        

                        return (
                          <>
                            {/* Call button - only show for waiting/scheduled/confirmed/skipped (before first call) */}
                            {buttons.includes('call') && (
                              <>
                                {actualConsultationMode === 'video_call' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCallNext(appointmentId)}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                  >
                                    <IoCallOutline className="h-3.5 w-3.5" />
                                    Call
                                  </button>
                                ) : isCallMode ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCallNext(appointmentId)}
                                      className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                    >
                                      <IoCallOutline className="h-3.5 w-3.5" />
                                      Call
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCallNext(appointmentId)}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                  >
                                    <IoCallOutline className="h-3.5 w-3.5" />
                                    Call
                                  </button>
                                )}
                              </>
                            )}

                            {/* Video Call button - only show for video_call mode after patient is called */}
                            {buttons.includes('videoCall') && consultationMode === 'video_call' && (
                              <button
                                type="button"
                                onClick={() => handleVideoCall(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 active:scale-95"
                              >
                                <IoVideocamOutline className="h-3.5 w-3.5" />
                                Video Call
                              </button>
                            )}

                            {/* Audio Call button - only show for call mode after patient is called */}
                            {buttons.includes('audioCall') && isCallMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  
                                  handleAudioCall(appointmentId)
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                                title="Start audio call"
                              >
                                <IoCallOutline className="h-3.5 w-3.5" />
                                Audio Call
                              </button>
                            )}

                            {/* Recall button - only show when called/in-consultation and recallCount < 2 */}
                            {buttons.includes('recall') && (
                              <button
                                type="button"
                                onClick={() => handleRecall(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#11496c] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                              >
                                <IoRefreshOutline className="h-3.5 w-3.5" />
                                Recall
                              </button>
                            )}

                            {/* Skip button */}
                            {buttons.includes('skip') && (
                              <button
                                type="button"
                                onClick={() => handleSkip(appointmentId)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                              >
                                Skip
                              </button>
                            )}

                            {/* No Show button */}
                            {buttons.includes('noShow') && (
                              <button
                                type="button"
                                onClick={() => handleNoShow(appointmentId)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                              >
                                No Show
                              </button>
                            )}

                            {/* Complete button */}
                            {buttons.includes('complete') && (
                              <button
                                type="button"
                                onClick={() => handleComplete(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                              >
                                <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            )}
                          </>
                        )
                      })()}
                      
                      {/* History button for no-show appointments */}
                      {appointment.status === 'no-show' && (
                        <button
                          type="button"
                          onClick={() => handleViewHistory(appointment)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                        >
                          <IoDocumentTextOutline className="h-3.5 w-3.5" />
                          History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
    </>
  );
};

export default AppointmentQueue;
