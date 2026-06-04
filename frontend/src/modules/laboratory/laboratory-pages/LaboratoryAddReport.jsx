import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoFlaskOutline,
  IoCalendarOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'
import { createLaboratoryReport, getLaboratoryOrders, updateLaboratoryOrder } from '../laboratory-services/laboratoryService'

const LaboratoryAddReport = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    } else {
      navigate('/laboratory/test-reports')
    }
  }, [orderId, navigate])

  const loadOrder = async () => {
    try {
      const response = await getLaboratoryOrders({ limit: 200 })
      const orders = Array.isArray(response)
        ? response
        : (response.data?.items || response.data?.orders || response.data?.leads || response.data || [])

      const foundOrder = orders.find(o =>
        o.id === orderId ||
        o._id === orderId ||
        o.orderId === orderId
      )
      
      if (foundOrder) {
        // Normalize order info for display
        setOrder({
          id: foundOrder._id || foundOrder.id,
          orderId: foundOrder.orderId || foundOrder._id || foundOrder.id,
          patientName: foundOrder.patientId?.firstName && foundOrder.patientId?.lastName
            ? `${foundOrder.patientId.firstName} ${foundOrder.patientId.lastName}`
            : foundOrder.patientId?.name || foundOrder.patientName || 'Unknown Patient',
          patientPhone: foundOrder.patientId?.phone || foundOrder.patientPhone || '',
          patientEmail: foundOrder.patientId?.email || foundOrder.patientEmail || '',
          testName: foundOrder.tests?.[0]?.name || foundOrder.tests?.[0] || foundOrder.testName || 'Test',
          orderDate: foundOrder.createdAt || foundOrder.orderDate || new Date().toISOString(),
          original: foundOrder,
        })
      } else {
        toast.error('Order not found')
        navigate('/laboratory/test-reports')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order data')
      navigate('/laboratory/test-reports')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
      e.target.value = '' // Reset input
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please drop a PDF file')
    }
  }

  const handleSaveReport = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file')
      return
    }

    if (!order) {
      return
    }

    setIsSending(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 150)

      const orderId = order.orderId || order.id || order._id
      const testName = order.testName || order.test?.name || 'Lab Test Report'
      
      // Create report with PDF file upload
      const reportData = {
        orderId: orderId,
        testName: testName,
        results: [], // Can be populated if needed
        notes: `Report uploaded: ${selectedFile.name}`,
      }
      
      // Upload PDF file and create report
      await createLaboratoryReport(reportData, selectedFile)

      // Mark order as completed so it appears in completed section
      try {
        if (orderId) {
          await updateLaboratoryOrder(orderId, { status: 'completed' })
        }
      } catch (statusError) {
        console.warn('Report uploaded but failed to update order status:', statusError)
      }
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      
      toast.success('Report uploaded successfully!')
      
      setTimeout(() => {
        navigate('/laboratory/test-reports')
      }, 1500)
    } catch (error) {
      console.error('Error uploading report:', error)
      setUploadStatus('error')
      setUploadProgress(0)
      toast.error('Failed to upload report. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Status Bar */}
      {uploadStatus && (
        <div className={`rounded-xl p-4 border shadow-sm ${
          uploadStatus === 'success' ? 'bg-emerald-50 border-emerald-200' :
          uploadStatus === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-blue-700 flex items-center gap-2">
                  <IoCloudUploadOutline className="h-4 w-4 animate-pulse" />
                  Uploading report...
                </span>
                <span className="text-blue-600 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-3">
              <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-emerald-700 block">Report added successfully!</span>
                <span className="text-xs text-emerald-600 mt-0.5">Redirecting to test reports...</span>
              </div>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="flex items-center gap-3">
              <IoCloseCircleOutline className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-red-700 block">Failed to add report</span>
                <span className="text-xs text-red-600 mt-0.5">Please try again</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 space-y-4">
        {/* Patient Info */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
              <IoPersonOutline className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Patient Information</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IoPersonOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Name:</span>
              <span className="text-xs font-semibold text-slate-900">{order.patientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <IoFlaskOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Order ID:</span>
              <span className="text-xs font-semibold text-slate-900">{order.orderId}</span>
            </div>
            <div className="flex items-center gap-2">
              <IoFlaskOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Test:</span>
              <span className="text-xs font-semibold text-slate-900">{order.testName}</span>
            </div>
            {order.patientPhone && (
              <div className="flex items-center gap-2">
                <IoCallOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Phone:</span>
                <span className="text-xs font-semibold text-slate-900">{order.patientPhone}</span>
              </div>
            )}
            {order.patientEmail && (
              <div className="flex items-center gap-2">
                <IoMailOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Email:</span>
                <span className="text-xs font-semibold text-slate-900 break-all">{order.patientEmail}</span>
              </div>
            )}
            {order.orderDate && (
              <div className="flex items-center gap-2">
                <IoCalendarOutline className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Order Date:</span>
                <span className="text-xs font-semibold text-slate-900">
                  {new Date(order.orderDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IoDocumentTextOutline className="h-4 w-4 text-[#11496c]" />
            <label className="block text-sm font-bold text-slate-900">Upload Report PDF</label>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="report-upload"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative"
            >
              <label
                htmlFor="report-upload"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFile
                    ? 'border-[#11496c] bg-[rgba(17,73,108,0.06)]'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-[#11496c] text-white shadow-sm">
                      <IoDocumentTextOutline className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <p className="text-xs text-[#11496c] font-medium">Click to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-200 text-slate-500">
                      <IoCloudUploadOutline className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 mb-0.5">Click to upload PDF</p>
                      <p className="text-xs text-slate-500">or drag and drop your file here</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                      <IoInformationCircleOutline className="h-3.5 w-3.5 text-slate-500" />
                      <p className="text-[10px] text-slate-600">PDF files only (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={() => navigate('/laboratory/test-reports')}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveReport}
            disabled={!selectedFile || isSending}
            className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#11496c]"
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <IoCloudUploadOutline className="h-4 w-4 animate-pulse" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <IoCheckmarkCircleOutline className="h-4 w-4" />
                Add Report
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

export default LaboratoryAddReport

