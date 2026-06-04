import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoCloseOutline,
} from 'react-icons/io5'

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 2500) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [removeToast])

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const value = useMemo(() => ({
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }), [showToast, removeToast, success, error, info, warning])

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: 'text-emerald-600',
          iconBg: 'bg-emerald-100',
          Icon: IoCheckmarkCircleOutline,
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          Icon: IoCloseCircleOutline,
        }
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: 'text-amber-600',
          iconBg: 'bg-amber-100',
          Icon: IoWarningOutline,
        }
      default: // info
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          Icon: IoInformationCircleOutline,
        }
    }
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container - Mobile First */}
      <div className="fixed top-4 left-0 right-0 z-50 pointer-events-none px-4 sm:left-auto sm:right-4 sm:top-4 sm:max-w-md">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const styles = getToastStyles(toast.type)
            const { Icon } = styles

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pointer-events-auto mb-3 rounded-xl border shadow-lg ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 rounded-full p-1.5 ${styles.iconBg}`}>
                    <Icon className={`h-5 w-5 ${styles.icon}`} />
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${styles.text} break-words`}>
                      {toast.message}
                    </p>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`flex-shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors ${styles.text}`}
                    aria-label="Close notification"
                  >
                    <IoCloseOutline className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

