import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.jsx'
// Initialize dummy data on app load
import './utils/initializeDummyData.js'
import { ToastProvider } from './contexts/ToastContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus for forms
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Suppress Razorpay SVG console errors (Razorpay's internal issue)
const originalError = console.error
console.error = (...args) => {
  // Filter out Razorpay SVG attribute errors
  if (
    args[0]?.includes?.('<svg> attribute') ||
    args[0]?.includes?.('Expected length') ||
    args[0]?.includes?.('"auto"')
  ) {
    return // Suppress these errors
  }
  originalError.apply(console, args)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
