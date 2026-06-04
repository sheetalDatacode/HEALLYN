import { motion } from 'framer-motion'
import { IoCallOutline, IoArrowForwardOutline } from 'react-icons/io5'

const LoginForm = ({
  selectedModule,
  getCurrentLoginData,
  handleLoginChange,
  otpSent,
  otpInputRefs,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  otpTimer,
  handleResendOtp,
  setOtpSent,
  setOtpTimer,
  setCurrentLoginData,
  isSubmitting,
  isSendingOtp,
  handleLoginSubmit,
  handleModeChange,
}) => {
  return (
    <motion.form
      key={`login-${selectedModule}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col gap-5 sm:gap-6"
      onSubmit={handleLoginSubmit}
    >
      {/* Mobile Number Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-phone" className="text-sm font-semibold text-slate-700">
          Mobile Number
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
            <IoCallOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="login-phone"
            name="phone"
            type="tel"
            value={getCurrentLoginData().phone}
            onChange={handleLoginChange}
            autoComplete="tel"
            required
            placeholder="9876543210"
            maxLength={10}
            inputMode="numeric"
            disabled={otpSent}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
          />
        </div>
      </div>

      {/* OTP Input Section - Show after OTP is sent */}
      {otpSent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-1.5"
        >
          <label className="text-sm font-semibold text-slate-700">Enter OTP</label>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => (otpInputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={getCurrentLoginData().otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:ring-2 focus:ring-[#11496c]/20"
                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {otpTimer > 0 ? (
                `Resend OTP in ${otpTimer}s`
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                >
                  Resend OTP
                </button>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false)
                setOtpTimer(0)
                const currentData = getCurrentLoginData()
                setCurrentLoginData({ ...currentData, otp: '' })
              }}
              className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
            >
              Change Number
            </button>
          </div>
        </motion.div>
      )}

      {/* Remember me checkbox */}
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            name="remember"
            checked={getCurrentLoginData().remember}
            onChange={handleLoginChange}
            className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
          />
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isSendingOtp}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
      >
        {isSubmitting ? (
          otpSent ? 'Verifying...' : 'Sending OTP...'
        ) : isSendingOtp ? (
          'Sending OTP...'
        ) : otpSent ? (
          <>
            Verify OTP
            <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
          </>
        ) : (
          <>
            Send OTP
            <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        New to Heallyn?{' '}
        <button
          type="button"
          onClick={() => handleModeChange('signup')}
          className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
        >
          Create an account
        </button>
      </p>
    </motion.form>
  )
}

export default LoginForm
