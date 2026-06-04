import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getLaboratoryProfile, updateLaboratoryProfile, uploadLaboratoryProfileImage } from '../laboratory-services/laboratoryService'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoFlaskOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoPulseOutline,
  IoLogOutOutline,
  IoArrowForwardOutline,
  IoPowerOutline,
  IoStarOutline,
} from 'react-icons/io5'

// Mock data removed - using real backend data now

// Helper function to resolve static URLs and handle localhost port changes dynamically
const resolveStaticUrl = (url) => {
  if (!url) return ''
  
  let cleanUrl = url
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) {
    const match = url.match(/https?:\/\/[^\/]+(\/.*)/)
    if (match && match[1]) {
      cleanUrl = match[1]
    }
  } else if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const baseUrl = apiBaseUrl.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}${cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`}`
}

const LaboratoryProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const isDashboardPage = location.pathname === '/laboratory/dashboard'
  
  // Initialize with empty/default data
  const [formData, setFormData] = useState({
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    profileImage: '',
    bio: '',
    gender: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    timings: [],
    testsOffered: [],
    serviceRadiusKm: 0,
    responseTimeMinutes: 0,
    documents: {},
    status: 'pending',
    rating: 0,
    isActive: true,
  })

  // Fetch laboratory profile from backend
  useEffect(() => {
    const fetchLaboratoryProfile = async () => {
      try {
      const token = getAuthToken('laboratory')
      if (!token) {
          
        setIsLoading(false)
        return
      }

        setIsLoading(true)
        
        
        // Try to load from cache first for faster initial render
        const storage = localStorage.getItem('laboratoryAuthToken') ? localStorage : sessionStorage
        const cachedProfile = JSON.parse(storage.getItem('laboratoryProfile') || '{}')
        if (Object.keys(cachedProfile).length > 0) {
          // Set initial form data from cache
          const cachedData = {
            labName: cachedProfile.labName || '',
            ownerName: cachedProfile.ownerName || '',
            email: cachedProfile.email || '',
            phone: cachedProfile.phone || '',
            licenseNumber: cachedProfile.licenseNumber || '',
            gstNumber: cachedProfile.gstNumber || '',
            profileImage: resolveStaticUrl(cachedProfile.profileImage || cachedProfile.documents?.profileImage || ''),
            bio: cachedProfile.bio || '',
            address: cachedProfile.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            contactPerson: cachedProfile.contactPerson || {
              name: '',
              phone: '',
              email: '',
            },
            timings: Array.isArray(cachedProfile.timings) ? cachedProfile.timings : [],
            testsOffered: Array.isArray(cachedProfile.testsOffered) ? cachedProfile.testsOffered : [],
            serviceRadiusKm: cachedProfile.serviceRadiusKm || 0,
            responseTimeMinutes: cachedProfile.responseTimeMinutes || 0,
            documents: cachedProfile.documents && Array.isArray(cachedProfile.documents) ? cachedProfile.documents : [],
            status: cachedProfile.status || 'pending',
            rating: cachedProfile.rating || 0,
            isActive: cachedProfile.isActive !== undefined ? cachedProfile.isActive : true,
            gender: cachedProfile.gender || '',
          }
          setFormData(cachedData)
        }

        // Then fetch fresh data from backend
        const response = await getLaboratoryProfile()
        
        if (response && (response.success || response.data)) {
          const laboratory = response.data?.laboratory || response.data || response
          
          
          // Transform backend data to frontend format
          const transformedData = {
            labName: laboratory.labName || '',
            ownerName: laboratory.ownerName || '',
            email: laboratory.email || '',
            phone: laboratory.phone || '',
            licenseNumber: laboratory.licenseNumber || '',
            gstNumber: laboratory.gstNumber || '',
            profileImage: resolveStaticUrl(laboratory.profileImage || laboratory.documents?.profileImage || ''),
            bio: laboratory.bio || '',
            gender: laboratory.gender || '',
            address: laboratory.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            contactPerson: laboratory.contactPerson || {
              name: '',
              phone: '',
              email: '',
            },
            // Transform timings from strings to objects for frontend
            // Backend sends: ['Monday: 10:00 AM - 6:00 PM', 'Tuesday: Closed', ...]
            // Frontend needs: [{ day: 'Monday', startTime: '10:00', endTime: '18:00', isOpen: true }, ...]
            timings: (() => {
              const timingsArray = Array.isArray(laboratory.timings) ? laboratory.timings : []
              return timingsArray.map((timing) => {
                // If already an object, return as is
                if (typeof timing === 'object' && timing !== null && !Array.isArray(timing)) {
                  return timing
                }
                
                // If it's a string, parse it
                if (typeof timing === 'string') {
                  // Format: "Monday: 10:00 - 18:00" or "Monday: Closed"
                  const match = timing.match(/^(.+?):\s*(.+)$/)
                  if (match) {
                    const day = match[1].trim()
                    const timePart = match[2].trim()
                    
                    if (timePart.toLowerCase() === 'closed') {
                      return { day, startTime: '', endTime: '', isOpen: false }
                    }
                    
                    // Parse time range: "10:00 - 18:00" or "10:00 AM - 6:00 PM"
                    const timeMatch = timePart.match(/(.+?)\s*-\s*(.+)/)
                    if (timeMatch) {
                      return {
                        day,
                        startTime: timeMatch[1].trim(),
                        endTime: timeMatch[2].trim(),
                        isOpen: true
                      }
                    }
                  }
                  
                  // If no match, treat as day name only
                  return { day: timing, startTime: '', endTime: '', isOpen: false }
                }
                
                // Fallback
                return { day: String(timing), startTime: '', endTime: '', isOpen: false }
              })
            })(),
            testsOffered: Array.isArray(laboratory.testsOffered) ? laboratory.testsOffered : [],
            serviceRadiusKm: laboratory.serviceRadiusKm || 0,
            responseTimeMinutes: laboratory.responseTimeMinutes || 0,
            documents: laboratory.documents && Array.isArray(laboratory.documents) ? laboratory.documents : [],
            status: laboratory.status || 'pending',
            rating: laboratory.rating || 0,
            isActive: laboratory.isActive !== undefined ? laboratory.isActive : true,
          }
          
          setFormData(transformedData)
          
          
          // Update cache
          const storage = localStorage.getItem('laboratoryAuthToken') ? localStorage : sessionStorage
          storage.setItem('laboratoryProfile', JSON.stringify(laboratory))
        } else {
          console.warn('Invalid response format:', response)
        }
      } catch (error) {
        console.error('Error fetching laboratory profile:', error)
        toast.error('Failed to load profile data. Please refresh the page.')
        // Ensure loading is set to false even on error
        setIsLoading(false)
      } finally {
        setIsLoading(false)
        
      }
    }

    fetchLaboratoryProfile()
  }, [toast])

  // Debug logging - must be before any conditional returns (React Hooks rules)
  useEffect(() => {
    
  }, [isLoading])

  useEffect(() => {
    if (isEditing) {
      
    }
  }, [isEditing, formData])

  const handleLogout = () => {
    localStorage.removeItem('laboratoryAuthToken')
    sessionStorage.removeItem('laboratoryAuthToken')
    navigate('/laboratory/login', { replace: true })
  }

  const formatAddress = (address) => {
    if (!address) return '—'
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
      address.country,
    ].filter(Boolean)
    return parts.join(', ') || '—'
  }

  // Format time from 24-hour to 12-hour format (e.g., "10:00" -> "10:00 AM", "18:00" -> "6:00 PM")
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return ''
    try {
      const [hours, minutes] = time24.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) return time24
      
      const period = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
    } catch {
      return time24
    }
  }

  const handleInputChange = (field, value) => {
    try {
    if (field.includes('.')) {
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
              ...(prev[parent] || {}),
            [child]: value,
          },
        }))
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
              ...(prev[parent] || {}),
            [child]: {
                ...(prev[parent]?.[child] || {}),
              [grandchild]: value,
            },
          },
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error)
      toast.error('Error updating field')
    }
  }

  const handleTimingChange = (index, field, value) => {
    setFormData((prev) => {
      const timings = Array.isArray(prev.timings) ? prev.timings : []
      const updated = [...timings]
      if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value }
      }
      return { ...prev, timings: updated }
    })
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    try {
      toast.info('Uploading image...')
      const response = await uploadLaboratoryProfileImage(file)
      
       // Debug log
      
      // Handle different response structures
      let imageUrl = null
      if (response?.success && response?.data?.url) {
        imageUrl = response.data.url
      } else if (response?.url) {
        imageUrl = response.url
      } else if (response?.data?.url) {
        imageUrl = response.data.url
      }
      
      if (imageUrl) {
        // Construct full URL if it's a relative path
        const fullImageUrl = resolveStaticUrl(imageUrl)
        
         // Debug log
        
        setFormData((prev) => ({
          ...prev,
          profileImage: fullImageUrl,
        }))
        
        // Also update the profile immediately to persist the image
        try {
          await updateLaboratoryProfile({ profileImage: fullImageUrl })
          toast.success('Profile image uploaded and saved successfully!')
        } catch (updateError) {
          console.error('Error updating profile with image:', updateError)
          toast.success('Image uploaded! Please save the profile to persist the change.')
        }
      } else {
        console.error('Invalid response format:', response)
        toast.error('Invalid response from server. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      
      // Check for connection errors
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.message?.includes('NetworkError')) {
        toast.error('Cannot connect to server. Please make sure the backend server is running.')
      } else {
        toast.error(error.message || 'Failed to upload profile image')
      }
    } finally {
      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleSave = async () => {
    const token = getAuthToken('laboratory')
    if (!token) {
      toast.error('Please login to save profile')
      return
    }

    try {
      setIsSaving(true)
      
      // Transform timings from objects to strings for backend
      // Backend expects: timings: ['Monday: 10:00 AM - 6:00 PM', 'Tuesday: Closed', ...]
      const transformTimingsForBackend = (timingsArray) => {
        if (!Array.isArray(timingsArray)) return []
        return timingsArray.map((timing) => {
          // If already a string, return as is
          if (typeof timing === 'string') return timing
          
          // If it's an object, convert to string format
          if (typeof timing === 'object' && timing !== null) {
            const day = timing.day || 'Day'
            if (timing.isOpen && timing.startTime && timing.endTime) {
              return `${day}: ${timing.startTime} - ${timing.endTime}`
            } else {
              return `${day}: Closed`
            }
          }
          return String(timing)
        })
      }
      
      // Prepare data for backend (match backend expected format)
      const updateData = {
        labName: formData.labName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        gstNumber: formData.gstNumber,
        profileImage: formData.profileImage,
        bio: formData.bio,
        gender: formData.gender,
        address: formData.address,
        contactPerson: formData.contactPerson,
        timings: transformTimingsForBackend(formData.timings),
        testsOffered: formData.testsOffered,
        serviceRadiusKm: formData.serviceRadiusKm,
        responseTimeMinutes: formData.responseTimeMinutes,
        documents: formData.documents,
        isActive: formData.isActive,
      }

      const response = await updateLaboratoryProfile(updateData)
      
      if (response && (response.success !== false)) {
        // Update cache
        const storage = localStorage.getItem('laboratoryAuthToken') ? localStorage : sessionStorage
        const profileData = response.data?.laboratory || response.data || response
        if (profileData) {
          storage.setItem('laboratoryProfile', JSON.stringify(profileData))
        }
        
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        setActiveSection(null)
      } else {
        toast.error(response?.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(error.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    // Reload original data from backend
    try {
      const response = await getLaboratoryProfile()
      if (response && (response.success || response.data)) {
        const laboratory = response.data?.laboratory || response.data || response
        const transformedData = {
          labName: laboratory.labName || '',
          ownerName: laboratory.ownerName || '',
          email: laboratory.email || '',
          phone: laboratory.phone || '',
          licenseNumber: laboratory.licenseNumber || '',
          gstNumber: laboratory.gstNumber || '',
          profileImage: resolveStaticUrl(laboratory.profileImage || laboratory.documents?.profileImage || ''),
          bio: laboratory.bio || '',
          address: laboratory.address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          contactPerson: laboratory.contactPerson || {
            name: '',
            phone: '',
            email: '',
          },
          // Transform timings from strings to objects for frontend
          timings: (() => {
            const timingsArray = Array.isArray(laboratory.timings) ? laboratory.timings : []
            return timingsArray.map((timing) => {
              // If already an object, return as is
              if (typeof timing === 'object' && timing !== null && !Array.isArray(timing)) {
                return timing
              }
              
              // If it's a string, parse it
              if (typeof timing === 'string') {
                // Format: "Monday: 10:00 - 18:00" or "Monday: Closed"
                const match = timing.match(/^(.+?):\s*(.+)$/)
                if (match) {
                  const day = match[1].trim()
                  const timePart = match[2].trim()
                  
                  if (timePart.toLowerCase() === 'closed') {
                    return { day, startTime: '', endTime: '', isOpen: false }
                  }
                  
                  // Parse time range: "10:00 - 18:00" or "10:00 AM - 6:00 PM"
                  const timeMatch = timePart.match(/(.+?)\s*-\s*(.+)/)
                  if (timeMatch) {
                    return {
                      day,
                      startTime: timeMatch[1].trim(),
                      endTime: timeMatch[2].trim(),
                      isOpen: true
                    }
                  }
                }
                
                // If no match, treat as day name only
                return { day: timing, startTime: '', endTime: '', isOpen: false }
              }
              
              // Fallback
              return { day: String(timing), startTime: '', endTime: '', isOpen: false }
            })
          })(),
          testsOffered: Array.isArray(laboratory.testsOffered) ? laboratory.testsOffered : [],
          serviceRadiusKm: laboratory.serviceRadiusKm || 0,
          responseTimeMinutes: laboratory.responseTimeMinutes || 0,
          documents: laboratory.documents || {},
          status: laboratory.status || 'pending',
          rating: laboratory.rating || 0,
          isActive: laboratory.isActive !== undefined ? laboratory.isActive : true,
          gender: laboratory.gender || '',
        }
        setFormData(transformedData)
      }
    } catch (error) {
      console.error('Error reloading profile:', error)
      toast.error('Failed to reload profile data')
    }
    setIsEditing(false)
    setActiveSection(null)
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }

  // Ensure formData is always properly structured - this must be before return
  const safeFormData = formData ? {
    labName: formData.labName || '',
    ownerName: formData.ownerName || '',
    email: formData.email || '',
    phone: formData.phone || '',
    licenseNumber: formData.licenseNumber || '',
    gstNumber: formData.gstNumber || '',
    profileImage: formData.profileImage || '',
    bio: formData.bio || '',
    gender: formData.gender || '',
    address: formData.address || {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    contactPerson: formData.contactPerson || {
      name: '',
      phone: '',
      email: '',
    },
    timings: Array.isArray(formData.timings) ? formData.timings : [],
    testsOffered: Array.isArray(formData.testsOffered) ? formData.testsOffered : [],
    serviceRadiusKm: formData.serviceRadiusKm || 0,
    responseTimeMinutes: formData.responseTimeMinutes || 0,
    documents: formData.documents && Array.isArray(formData.documents) ? formData.documents : [],
    status: formData.status || 'pending',
    rating: formData.rating || 0,
    isActive: formData.isActive !== undefined ? formData.isActive : true,
  } : {
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    profileImage: '',
    bio: '',
    gender: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    timings: [],
    testsOffered: [],
    serviceRadiusKm: 0,
    responseTimeMinutes: 0,
    documents: {},
    status: 'pending',
    rating: 0,
    isActive: true,
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <section className={`flex flex-col gap-4 pb-24 lg:pb-8 ${isDashboardPage ? '-mt-20' : ''} lg:mt-0`}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#11496c] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
            </div>
          </div>
        </section>
      </>
    )
  }

  // Always render - ensure component never returns undefined
  return (
    <section className="flex flex-col gap-6 pb-24 lg:pb-12">
      {/* Responsive Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full px-4">
        
        {/* Left Column - Profile Header Card (Responsive) */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:shadow-[#11496c]/20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            <div className="relative flex flex-col items-center text-center gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="relative h-32 w-32 sm:h-40 sm:w-40 transition-transform duration-500 group-hover:rotate-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    id="laboratory-profile-image-input"
                  />
                  <img
                    src={safeFormData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFormData.labName || 'Laboratory')}&background=ffffff&color=11496c&size=128&bold=true`}
                    alt={safeFormData.labName || 'Laboratory'}
                    className="h-full w-full rounded-full object-cover ring-8 ring-white/20 shadow-2xl bg-white/10 backdrop-blur-md"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFormData.labName || 'Laboratory')}&background=ffffff&color=11496c&size=128&bold=true`
                    }}
                  />
                  {isEditing && (
                    <label
                      htmlFor="laboratory-profile-image-input"
                      className="absolute bottom-1 right-1 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#11496c] shadow-2xl transition-all hover:bg-slate-50 hover:scale-110 cursor-pointer border-4 border-[#11496c]"
                    >
                      <IoCameraOutline className="h-6 w-6" />
                    </label>
                  )}
                </div>
              </div>

              {/* Lab Identity */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {safeFormData.labName || 'Laboratory'}
                </h1>
                <p className="text-sm sm:text-base text-white/80 font-medium truncate max-w-[250px] mx-auto">
                  {safeFormData.email || ''}
                </p>
              </div>

              {/* Meta Badges */}
              <div className="flex flex-wrap justify-center gap-2">
                {safeFormData.licenseNumber && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold text-white border border-white/20">
                    <IoFlaskOutline className="h-4 w-4" />
                    {safeFormData.licenseNumber}
                  </div>
                )}
                {safeFormData.gender && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-bold text-white border border-white/20">
                    <IoPersonOutline className="h-4 w-4" />
                    {safeFormData.gender}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-1 gap-3 pt-4 border-t border-white/10">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#11496c] shadow-xl transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-3 border-[#11496c] border-t-transparent" />
                      ) : (
                        <>
                          <IoCheckmarkCircleOutline className="h-5 w-5" />
                          Save Profile
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                    >
                      <IoCloseOutline className="h-5 w-5" />
                      Discard Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true)
                        setActiveSection('basic')
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white border border-white/20 transition-all hover:bg-white/25 active:scale-95"
                    >
                      <IoCreateOutline className="h-5 w-5" />
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-red-200 border border-red-500/20 transition-all hover:bg-red-500/20 active:scale-95"
                    >
                      <IoLogOutOutline className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Right Column - Information Sections (Desktop) */}
          <div className="lg:col-span-2 lg:space-y-4">

            {/* Basic Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Basic Information</h2>
                {(activeSection === 'basic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'basic' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 lg:pt-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Laboratory Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={safeFormData.labName}
                          onChange={(e) => handleInputChange('labName', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{safeFormData.labName || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Owner Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={safeFormData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{safeFormData.ownerName || ''}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        License Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={safeFormData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{safeFormData.licenseNumber || ''}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={safeFormData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-sm text-slate-900">{safeFormData.gender ? safeFormData.gender.charAt(0).toUpperCase() + safeFormData.gender.slice(1) : 'Not set'}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={safeFormData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    ) : (
                      <p className="text-sm text-slate-600">{formData?.bio || ''}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('contact')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Contact Information</h2>
                {(activeSection === 'contact' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'contact' || isEditing) && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={safeFormData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#11496c]/10 transition-all"
                        />
                      ) : (
                        <p className="px-1 text-sm font-semibold text-slate-900">{safeFormData.email || '—'}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={safeFormData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#11496c]/10 transition-all"
                        />
                      ) : (
                        <p className="px-1 text-sm font-semibold text-slate-900">{safeFormData.phone || '—'}</p>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                        Laboratory Address
                      </label>
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={safeFormData.address.line1}
                            onChange={(e) => handleInputChange('address.line1', e.target.value)}
                            placeholder="Street Address"
                            className="sm:col-span-2 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#11496c]/10 transition-all"
                          />
                          <input
                            type="text"
                            value={safeFormData.address.city}
                            onChange={(e) => handleInputChange('address.city', e.target.value)}
                            placeholder="City"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#11496c]/10 transition-all"
                          />
                          <input
                            type="text"
                            value={safeFormData.address.state}
                            onChange={(e) => handleInputChange('address.state', e.target.value)}
                            placeholder="State"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#11496c]/10 transition-all"
                          />
                        </div>
                      ) : (
                        <p className="px-1 text-sm font-semibold text-slate-900 leading-relaxed">
                          {formatAddress(safeFormData.address)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="rounded-[32px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('hours')}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <IoTimeOutline className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Operating Hours</h2>
                </div>
                {(activeSection === 'hours' || isEditing) ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {(activeSection === 'hours' || isEditing) && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="pt-6 space-y-3">
                    {Array.isArray(safeFormData.timings) && safeFormData.timings.length > 0 ? (
                      safeFormData.timings.map((timing, index) => {
                        const timingObj = typeof timing === 'string' 
                          ? { day: timing, startTime: '', endTime: '', isOpen: true }
                          : (timing || { day: 'Day', startTime: '', endTime: '', isOpen: true })
                        
                        return (
                          <div key={timingObj?.day || index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                            <p className="text-sm font-bold text-slate-800 w-24">{timingObj.day || 'Day'}</p>
                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="time"
                                  value={timingObj.startTime || ''}
                                  onChange={(e) => handleTimingChange(index, 'startTime', e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#11496c]/10 transition-all"
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">to</span>
                                <input
                                  type="time"
                                  value={timingObj.endTime || ''}
                                  onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#11496c]/10 transition-all"
                                />
                                <label className="ml-2 flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={timingObj.isOpen || false}
                                    onChange={(e) => handleTimingChange(index, 'isOpen', e.target.checked)}
                                    className="h-4 w-4 rounded-lg border-slate-300 text-[#11496c] focus:ring-[#11496c]/20"
                                  />
                                  <span className="text-xs font-bold text-slate-600 group-hover:text-[#11496c]">Open</span>
                                </label>
                              </div>
                            ) : (
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${timingObj.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {timingObj.isOpen && timingObj.startTime && timingObj.endTime 
                                  ? `${formatTimeTo12Hour(timingObj.startTime)} - ${formatTimeTo12Hour(timingObj.endTime)}`
                                  : timingObj.isOpen ? 'Open' : 'Closed'}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium text-slate-400">No operating hours configured</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Documents */}
            <div className="rounded-[32px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('documents')}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <IoDocumentTextOutline className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Digital Vault</h2>
                </div>
                {activeSection === 'documents' ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {activeSection === 'documents' && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="pt-6 space-y-3">
                    {formData.documents && Array.isArray(formData.documents) && formData.documents.length > 0 ? (
                      formData.documents.map((doc, index) => {
                        const normalizedUrl = normalizeDocumentUrl(doc.fileUrl || '')
                        return (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-lg"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#11496c]">
                                <IoDocumentTextOutline className="h-6 w-6" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{doc.name || 'Digital Document'}</p>
                                {doc.uploadedAt && (
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    Vaulted on {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {normalizedUrl && (
                                <>
                                  <a
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#11496c] shadow-sm border border-slate-100 transition-all hover:bg-slate-50"
                                  >
                                    <IoEyeOutline className="h-4 w-4" />
                                    View
                                  </a>
                                  <a
                                    href={normalizedUrl}
                                    download
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#11496c]/20 transition-all hover:scale-[1.02]"
                                  >
                                    <IoDownloadOutline className="h-4 w-4" />
                                    Fetch
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <IoDocumentTextOutline className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-400">Vault is currently empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Support History */}
            <div className="rounded-[32px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('support')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Support History</h2>
                {(activeSection === 'support' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'support' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="pt-3 sm:pt-4 lg:pt-3">
                    <SupportHistory role="laboratory" />
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </section>
  )
}

// Support History Component
const SupportHistory = ({ role }) => {
  const [supportRequests, setSupportRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSupportTickets()
  }, [role])

  const fetchSupportTickets = async () => {
    try {
      setIsLoading(true)
      const { getSupportTickets } = await import('../laboratory-services/laboratoryService')
      const response = await getSupportTickets()
      
      let tickets = []
      if (Array.isArray(response)) {
        tickets = response
      } else if (response?.data?.items && Array.isArray(response.data.items)) {
        tickets = response.data.items
      } else if (response?.data && Array.isArray(response.data)) {
        tickets = response.data
      } else if (response?.tickets && Array.isArray(response.tickets)) {
        tickets = response.tickets
      }
      
      setSupportRequests(tickets || [])
    } catch (error) {
      console.error('Error fetching support tickets:', error)
      setSupportRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800' },
      closed: { label: 'Closed', color: 'bg-slate-200 text-slate-700' },
    }
    const config = statusConfig[status?.toLowerCase()] || statusConfig.open
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#11496c] border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Records...</p>
      </div>
    )
  }

  if (supportRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <IoHelpCircleOutline className="h-12 w-12 text-slate-200 mb-3" />
        <p className="text-sm font-bold text-slate-400">No support history found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {supportRequests.map((request, index) => {
        if (!request) return null
        
        return (
          <div key={request?.id || request?._id || `ticket-${index}`} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#11496c]" />
                  <p className="text-xs font-bold text-[#11496c] uppercase tracking-widest">Case #{index + 1}</p>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#11496c] transition-colors">{request?.subject || 'General Inquiry'}</h3>
                <p className="text-sm font-medium text-slate-600 line-clamp-2">{request?.message || request?.note || 'No description provided'}</p>
              </div>
              {getStatusBadge(request?.status || 'open')}
            </div>

            {request?.adminNote && (
              <div className="mb-4 rounded-xl bg-blue-50/50 border border-blue-100/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <IoShieldCheckmarkOutline className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Resolution Note</p>
                </div>
                <p className="text-sm font-medium text-blue-800">{request.adminNote}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                <IoCalendarOutline className="h-3.5 w-3.5" />
                <span>Logged: {formatDate(request?.createdAt)}</span>
              </div>
              {request?.updatedAt && request.updatedAt !== request.createdAt && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
                  <IoPulseOutline className="h-3.5 w-3.5" />
                  <span>Activity: {formatDate(request.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LaboratoryProfile

