import React from 'react'
import {
  IoCloseOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'

const CancelSessionModal = (props) => {
  const {
    showHistoryModal,
    setShowHistoryModal,
    selectedPatient,
    medicalHistory,
    formatDate,
    showCancelSessionModal,
    setShowCancelSessionModal,
    currentSession,
    cancelReason,
    setCancelReason,
    handleCancelSession,
  } = props;

  return (
    <>
      {/* Cancel Session Modal */}
      {showCancelSessionModal && currentSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowCancelSessionModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cancel Session</h2>
                  <p className="text-xs text-slate-600">{currentSession?.date ? formatDate(currentSession.date) : 'N/A'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelSessionModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800 mb-1">Warning</p>
                <p className="text-xs text-red-700">
                  Cancelling this session will cancel all appointments. Patients will be notified and can reschedule.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this session..."
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowCancelSessionModal(false)
                  setCancelReason('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={!cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelSessionModal;
