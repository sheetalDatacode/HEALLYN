import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPharmacyProfile, updatePharmacyProfile, getSupportHistory, uploadProfileImage } from '../pharmacy-services/pharmacyService'
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
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoPulseOutline,
  IoTrashOutline,
  IoAddOutline,
  IoEyeOutline,
  IoDownloadOutline,
} from 'react-icons/io5'

// Mock data removed - using real backend data now

// Helper function to normalize document URLs
const normalizeDocumentUrl = (url) => {
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

// Utility function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';
  
  // Handle time format like "17:00" or "17:00:00"
  const timeStr = time24.toString().trim();
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${hours12}:${minutesStr} ${period}`;
};

const PharmacyProfile = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Initialize with empty/default data
  const [formData, setFormData] = useState({
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    profileImage: '',
    bio: '',
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
    deliveryOptions: [],
    serviceRadiusKm: 0,
    responseTimeMinutes: 0,
    documents: {},
    status: 'pending',
    rating: 0,
    isActive: true,
  })

  // Fetch pharmacy profile from backend
  useEffect(() => {
    const fetchPharmacyProfile = async () => {
      const token = getAuthToken('pharmacy')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Try to load from cache first for faster initial render
        const storage = localStorage.getItem('pharmacyAuthToken') ? localStorage : sessionStorage
        const cachedProfile = JSON.parse(storage.getItem('pharmacyProfile') || '{}')
        if (Object.keys(cachedProfile).length > 0) {
          // Set initial form data from cache
          const cachedData = {
            pharmacyName: cachedProfile.pharmacyName || '',
            ownerName: cachedProfile.ownerName || '',
            email: cachedProfile.email || '',
            phone: cachedProfile.phone || '',
            licenseNumber: cachedProfile.licenseNumber || '',
            gstNumber: cachedProfile.gstNumber || '',
            profileImage: cachedProfile.profileImage || cachedProfile.documents?.profileImage || '',
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
            deliveryOptions: Array.isArray(cachedProfile.deliveryOptions) ? cachedProfile.deliveryOptions : [],
            serviceRadiusKm: cachedProfile.serviceRadiusKm || 0,
            responseTimeMinutes: cachedProfile.responseTimeMinutes || 0,
            documents: cachedProfile.documents && Array.isArray(cachedProfile.documents) ? cachedProfile.documents : [],
            status: cachedProfile.status || 'pending',
            rating: cachedProfile.rating || 0,
            isActive: cachedProfile.isActive !== undefined ? cachedProfile.isActive : true,
          }
          setFormData(cachedData)
        }

        // Then fetch fresh data from backend
        const response = await getPharmacyProfile()
        if (response.success && response.data) {
          const pharmacy = response.data.pharmacy || response.data
          
          // Transform backend data to frontend format
          const transformedData = {
            pharmacyName: pharmacy.pharmacyName || '',
            ownerName: pharmacy.ownerName || '',
            email: pharmacy.email || '',
            phone: pharmacy.phone || '',
            licenseNumber: pharmacy.licenseNumber || '',
            gstNumber: pharmacy.gstNumber || '',
            profileImage: pharmacy.profileImage || pharmacy.documents?.profileImage || '',
            bio: pharmacy.bio || '',
            address: pharmacy.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            contactPerson: pharmacy.contactPerson || {
              name: '',
              phone: '',
              email: '',
            },
            timings: Array.isArray(pharmacy.timings) ? pharmacy.timings : [],
            deliveryOptions: Array.isArray(pharmacy.deliveryOptions) ? pharmacy.deliveryOptions : [],
            serviceRadiusKm: pharmacy.serviceRadiusKm || 0,
            responseTimeMinutes: pharmacy.responseTimeMinutes || 0,
            documents: pharmacy.documents && Array.isArray(pharmacy.documents) ? pharmacy.documents : [],
            status: pharmacy.status || 'pending',
            rating: pharmacy.rating || 0,
            isActive: pharmacy.isActive !== undefined ? pharmacy.isActive : true,
          }
          
          setFormData(transformedData)
          
          // Update cache
          const storage = localStorage.getItem('pharmacyAuthToken') ? localStorage : sessionStorage
          storage.setItem('pharmacyProfile', JSON.stringify(pharmacy))
        }
      } catch (error) {
        console.error('Error fetching pharmacy profile:', error)
        toast.error('Failed to load profile data. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPharmacyProfile()
  }, [toast])

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

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }))
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent]?.[child],
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
  }

  const handleTimingChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.timings]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, timings: updated }
    })
  }

  const handleSave = async () => {
    const token = getAuthToken('pharmacy')
    if (!token) {
      toast.error('Please login to save profile')
      return
    }

    try {
      setIsSaving(true)
      
      // Prepare data for backend (match backend expected format)
      // Ensure timings is a proper array of objects
      const cleanTimings = Array.isArray(formData.timings)
        ? formData.timings.map(timing => ({
            day: timing.day || '',
            startTime: timing.startTime || '',
            endTime: timing.endTime || '',
            isOpen: timing.isOpen !== undefined ? timing.isOpen : true,
          }))
        : []

      const updateData = {
        pharmacyName: formData.pharmacyName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        gstNumber: formData.gstNumber,
        profileImage: formData.profileImage,
        bio: formData.bio,
        address: formData.address,
        contactPerson: formData.contactPerson,
        timings: cleanTimings,
        deliveryOptions: Array.isArray(formData.deliveryOptions) ? formData.deliveryOptions : [],
        serviceRadiusKm: formData.serviceRadiusKm || 0,
        responseTimeMinutes: formData.responseTimeMinutes || 0,
        documents: formData.documents && Array.isArray(formData.documents) ? formData.documents : [],
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      }

      const response = await updatePharmacyProfile(updateData)
      
      if (response.success) {
        // Update cache
        const storage = localStorage.getItem('pharmacyAuthToken') ? localStorage : sessionStorage
        storage.setItem('pharmacyProfile', JSON.stringify(response.data?.pharmacy || response.data))
        
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        setActiveSection(null)
      } else {
        toast.error(response.message || 'Failed to update profile')
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
      const response = await getPharmacyProfile()
      if (response.success && response.data) {
        const pharmacy = response.data.pharmacy || response.data
        const transformedData = {
          pharmacyName: pharmacy.pharmacyName || '',
          ownerName: pharmacy.ownerName || '',
          email: pharmacy.email || '',
          phone: pharmacy.phone || '',
          licenseNumber: pharmacy.licenseNumber || '',
          gstNumber: pharmacy.gstNumber || '',
          profileImage: pharmacy.profileImage || pharmacy.documents?.profileImage || '',
          bio: pharmacy.bio || '',
          address: pharmacy.address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          contactPerson: pharmacy.contactPerson || {
            name: '',
            phone: '',
            email: '',
          },
          timings: Array.isArray(pharmacy.timings) ? pharmacy.timings : [],
          deliveryOptions: Array.isArray(pharmacy.deliveryOptions) ? pharmacy.deliveryOptions : [],
          serviceRadiusKm: pharmacy.serviceRadiusKm || 0,
          responseTimeMinutes: pharmacy.responseTimeMinutes || 0,
          documents: pharmacy.documents || {},
          status: pharmacy.status || 'pending',
          rating: pharmacy.rating || 0,
          isActive: pharmacy.isActive !== undefined ? pharmacy.isActive : true,
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
      const response = await uploadProfileImage(file)
      
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
        let cleanImageUrl = imageUrl
        if (imageUrl.startsWith('http://localhost:') || imageUrl.startsWith('http://127.0.0.1:')) {
          const match = imageUrl.match(/https?:\/\/[^\/]+(\/.*)/)
          if (match && match[1]) {
            cleanImageUrl = match[1]
          }
        }
        
        // Get base URL without /api for static file serving
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
        const baseUrl = apiBaseUrl.replace('/api', '').replace(/\/$/, '')
        const fullImageUrl = (imageUrl.startsWith('http') && !imageUrl.startsWith('http://localhost:') && !imageUrl.startsWith('http://127.0.0.1:'))
          ? imageUrl 
          : cleanImageUrl.startsWith('/')
            ? `${baseUrl}${cleanImageUrl}`
            : `${baseUrl}/uploads/${cleanImageUrl}`
        
         // Debug log
        
        setFormData((prev) => ({
          ...prev,
          profileImage: fullImageUrl,
        }))
        
        // Also update the profile immediately to persist the image
        try {
          await updatePharmacyProfile({ profileImage: fullImageUrl })
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

  // Show loading state
  if (isLoading) {
    return (
      <section className="flex flex-col gap-6 pb-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#11496c] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Profile Card - Matching Reference Image */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{
          background: 'linear-gradient(135deg, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        
        <div className="relative flex flex-col items-center text-center">
          {/* Profile Picture */}
          <div className="relative mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
              id="pharmacy-profile-image-input"
            />
            <img
              src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.pharmacyName || 'Pharmacy')}&background=3b82f6&color=fff&size=128&bold=true`}
              alt={formData.pharmacyName || 'Pharmacy'}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-white/20 shadow-xl bg-slate-100"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.pharmacyName || 'Pharmacy')}&background=3b82f6&color=fff&size=128&bold=true`
              }}
            />
            {isEditing && (
              <label
                htmlFor="pharmacy-profile-image-input"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-lg transition hover:bg-white/30 cursor-pointer"
                aria-label="Change photo"
              >
                <IoCameraOutline className="h-4 w-4" />
              </label>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {formData.pharmacyName || 'Pharmacy'}
          </h1>

          {/* Email */}
          <p className="text-sm sm:text-base text-white/90 mb-4">
            {formData.email}
          </p>


          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:border-white/40 active:scale-95"
            >
              <IoCreateOutline className="h-5 w-5" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('pharmacyAuthToken')
                sessionStorage.removeItem('pharmacyAuthToken')
                navigate('/pharmacy/login', { replace: true })
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/25 active:scale-95"
            >
              <IoLogOutOutline className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      )}

      {/* Profile Sections */}
      <div className="space-y-4">
        {/* Basic Information */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('basic')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoPersonOutline className="h-5 w-5 text-slate-600" />
              Basic Information
            </h3>
            {activeSection === 'basic' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'basic' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pharmacy Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pharmacyName || ''}
                    onChange={(e) => handleInputChange('pharmacyName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.pharmacyName || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.ownerName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">License Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.licenseNumber || ''}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.licenseNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600">{formData.bio}</p>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Contact Information */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('contact')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoCallOutline className="h-5 w-5 text-slate-600" />
              Contact Information
            </h3>
            {activeSection === 'contact' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'contact' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Person</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.contactPerson?.name || ''}
                      onChange={(e) => handleInputChange('contactPerson.name', e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="tel"
                      value={formData.contactPerson?.phone || ''}
                      onChange={(e) => handleInputChange('contactPerson.phone', e.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="email"
                      value={formData.contactPerson?.email || ''}
                      onChange={(e) => handleInputChange('contactPerson.email', e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-slate-900">
                    <p>{formData.contactPerson.name}</p>
                    <p className="text-slate-600">{formData.contactPerson.phone}</p>
                    <p className="text-slate-600">{formData.contactPerson.email}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.address?.line1 || ''}
                      onChange={(e) => handleInputChange('address.line1', e.target.value)}
                      placeholder="Address Line 1"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="text"
                      value={formData.address?.line2 || ''}
                      onChange={(e) => handleInputChange('address.line2', e.target.value)}
                      placeholder="Address Line 2"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="City"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        value={formData.address?.state || ''}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address?.postalCode || ''}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        value={formData.address?.country || ''}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        placeholder="Country"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-900">{formatAddress(formData.address)}</p>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Operating Hours */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('hours')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoTimeOutline className="h-5 w-5 text-slate-600" />
              Operating Hours
            </h3>
            {activeSection === 'hours' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'hours' && (
            <div className="mt-4 space-y-2">
              {isEditing ? (
                <>
                  {formData.timings && formData.timings.length > 0 ? (
                    formData.timings.map((timing, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                        <input
                          type="time"
                          value={timing.startTime || ''}
                          onChange={(e) => handleTimingChange(index, 'startTime', e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                        <span className="text-sm text-slate-500 font-medium">to</span>
                        <input
                          type="time"
                          value={timing.endTime || ''}
                          onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              timings: prev.timings.filter((_, i) => i !== index),
                            }));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50 shrink-0"
                        >
                          <IoTrashOutline className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No timings set</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        timings: [...(prev.timings || []), {
                          day: '',
                          startTime: '',
                          endTime: '',
                          isOpen: true,
                        }],
                      }));
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <IoAddOutline className="h-4 w-4" />
                    Add Timing
                  </button>
                </>
              ) : (
                <>
                  {formData.timings && formData.timings.length > 0 ? (
                    formData.timings.map((timing, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                        <IoTimeOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                        <span className="text-sm font-medium text-slate-900">
                          {timing.startTime && timing.endTime
                            ? `${formatTimeTo12Hour(timing.startTime)} - ${formatTimeTo12Hour(timing.endTime)}`
                            : 'Not set'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No operating hours set</p>
                  )}
                </>
              )}
            </div>
          )}
        </article>

        {/* Uploaded Documents */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('documents')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoDocumentTextOutline className="h-5 w-5 text-slate-600" />
              Uploaded Documents
            </h3>
            {activeSection === 'documents' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'documents' && (
            <div className="mt-4 space-y-2">
              {formData.documents && Array.isArray(formData.documents) && formData.documents.length > 0 ? (
                formData.documents.map((doc, index) => {
                  const normalizedUrl = normalizeDocumentUrl(doc.fileUrl || '')
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IoDocumentTextOutline className="h-5 w-5 text-[#11496c] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-700 block truncate">{doc.name || 'Document'}</span>
                          {doc.uploadedAt && (
                            <span className="text-xs text-slate-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {normalizedUrl && (
                          <>
                            <a
                              href={normalizedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-[#11496c] hover:underline flex items-center gap-1"
                            >
                              <IoEyeOutline className="h-4 w-4" />
                              View
                            </a>
                            <a
                              href={normalizedUrl}
                              download
                              className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <IoDownloadOutline className="h-4 w-4" />
                              Download
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500 italic">No documents uploaded</p>
              )}
            </div>
          )}
        </article>

        {/* Support History */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('support')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoHelpCircleOutline className="h-5 w-5 text-slate-600" />
              Support History
            </h3>
            {activeSection === 'support' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'support' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <SupportHistory role="pharmacy" />
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

// Support History Component
const SupportHistory = ({ role }) => {
  const [supportRequests, setSupportRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchSupportHistory = async () => {
      try {
        setLoading(true)
        const response = await getSupportHistory()
        
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          
          // Transform tickets to match component structure
          const transformedTickets = items.map(ticket => ({
            id: ticket._id || ticket.id,
            note: ticket.message || ticket.subject || ticket.note || '',
            subject: ticket.subject || ticket.message || '',
            message: ticket.message || ticket.subject || '',
            status: ticket.status || 'pending',
            createdAt: ticket.createdAt || ticket.date || new Date().toISOString(),
            updatedAt: ticket.updatedAt || ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
            adminNote: ticket.adminNote || ticket.response || ticket.adminResponse || '',
            priority: ticket.priority || 'medium',
          }))
          
          setSupportRequests(transformedTickets)
        }
      } catch (error) {
        console.error('Error fetching support history:', error)
        toast.error('Failed to load support history')
        setSupportRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchSupportHistory()
  }, [role, toast])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">Loading support history...</p>
      </div>
    )
  }

  if (supportRequests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">No support requests yet</p>
        <p className="mt-1 text-xs text-slate-500">Your support request history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {supportRequests.map((request) => (
        <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900 flex-1">{request.note}</p>
            {getStatusBadge(request.status)}
          </div>
          {request.adminNote && (
            <div className="mt-2 rounded bg-blue-50 p-2">
              <p className="text-xs font-semibold text-blue-900">Admin Response:</p>
              <p className="mt-1 text-xs text-blue-800">{request.adminNote}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>Submitted: {formatDate(request.createdAt)}</span>
            {request.updatedAt !== request.createdAt && (
              <span>Updated: {formatDate(request.updatedAt)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PharmacyProfile

