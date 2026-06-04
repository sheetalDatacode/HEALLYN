import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import { getNurseProfile, updateNurseProfile } from '../nurse-services/nurseService'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoMedicalOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoSchoolOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoPowerOutline,
} from 'react-icons/io5'

// Utility function to normalize image URLs
const normalizeImageUrl = (url) => {
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

const NurseProfile = () => {
  const location = useLocation()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/nurse/dashboard' || location.pathname === '/nurse/'

  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // Initialize with empty/default data matching signup form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
    },
    qualification: '',
    experienceYears: '', // Changed to empty string default
    specialization: '',
    bio: '',
    fees: '', // Changed value default
    availability: [], // Added availability
    registrationNumber: '',
    registrationCouncilName: '',
    documents: [],
    status: 'pending',
    isActive: true,
  })

  // Fetch nurse profile from backend
  useEffect(() => {
    const fetchNurseProfile = async () => {
      const token = getAuthToken('nurse')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await getNurseProfile()
        if (response.success && response.data) {
          const nurse = response.data.nurse || response.data
          setFormData({
            firstName: nurse.firstName || '',
            lastName: nurse.lastName || '',
            email: nurse.email || '',
            phone: nurse.phone || '',
            profileImage: normalizeImageUrl(nurse.profileImage || ''),
            address: nurse.address || {
              line1: '',
              city: '',
              state: '',
              postalCode: '',
            },
            qualification: nurse.qualification || '',
            experienceYears: nurse.experienceYears || '',
            specialization: nurse.specialization || '',
            fees: nurse.fees || '',
            bio: nurse.bio || '',
            availability: nurse.availability || [],
            registrationNumber: nurse.registrationNumber || '',
            registrationCouncilName: nurse.registrationCouncilName || '',
            documents: Array.isArray(nurse.documents) ? nurse.documents : [],
            status: nurse.status || 'pending',
            isActive: nurse.isActive !== undefined ? nurse.isActive : true,
          })
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching nurse profile:', err)
        toast.error('Failed to load profile')
        setIsLoading(false)
      }
    }

    fetchNurseProfile()
  }, [toast])

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
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setSelectedImage(file)
    setFormData(prev => ({ ...prev, profileImage: previewUrl }))
  }

  const handleAvailabilityChange = (day) => {
    setFormData(prev => {
      const current = prev.availability || []
      if (current.includes(day)) {
        return { ...prev, availability: current.filter(d => d !== day) }
      } else {
        return { ...prev, availability: [...current, day] }
      }
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const formDataToSend = new FormData()

      // Append core fields
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      // Only append if they have values to avoid sending "undefined" string
      if (formData.email) formDataToSend.append('email', formData.email)
      if (formData.phone) formDataToSend.append('phone', formData.phone)
      if (formData.qualification) formDataToSend.append('qualification', formData.qualification)

      // Handle numeric/optional fields safely
      if (formData.experienceYears !== '' && formData.experienceYears !== null) {
        formDataToSend.append('experienceYears', formData.experienceYears)
      }

      if (formData.specialization) formDataToSend.append('specialization', formData.specialization)

      if (formData.bio) formDataToSend.append('bio', formData.bio)

      if (formData.fees !== '' && formData.fees !== null) {
        formDataToSend.append('fees', formData.fees)
      }

      if (formData.registrationNumber) formDataToSend.append('registrationNumber', formData.registrationNumber)
      if (formData.registrationCouncilName) formDataToSend.append('registrationCouncilName', formData.registrationCouncilName)

      // Handle address (nested object) - Backend expects dot notation or we can stringify if backend parses it
      // Based on controller, it uses updates = {...req.body}, so we should probably send detailed keys if controller doesn't parse JSON
      // But looking at nurseAuthController.js: it expects address.line1 etc.
      // Wait, standard FormData with nested objects usually requires 'address[line1]' or 'address.line1'.
      // The controller accesses `req.body.address.line1` which implies parsing.
      // Express body-parser usually handles JSON. Multer handles FormData.
      // If using multer with text fields, they come as strings.
      // The safest way given the controller structure (updates.address.line1) is that it expects an object structure.
      // If we send 'address[line1]', multer/body-parser might strictly parse it.
      // Actually, the previous code sent JSON `updateData`. 
      // If I change to FormData, I must ensure backend handles it.
      // The controller accesses `updates.address.line1` directly if updates is req.body.
      // If I send FormData, req.body will have keys. If I send key 'address[line1]', req.body might have 'address': { 'line1': ... } if using certain middleware (like 'qs' or extended urlencoded).
      // However, to be safe and simple, I'll update the controller to handle flattened keys if needed, OR 
      // I can send all address fields as individual keys and reconstructing them on backend is safer?
      // No, let's keep it simple: I will send `address` as a JSON string and parse it in backend if needed?
      // Wait, the backend controller lines 220-226: `address: { line1: address.line1 ...`. This is for registration.
      // For UPDATE (lines 345+), it does `const updates = { ...req.body }`.
      // It does NOT explicitly parse address.
      // So if I pass 'address.line1' as key in FormData, `req.body['address.line1']` will exist, not `req.body.address.line1`.
      // FIX logic: I will append address fields individually and update them if they exist?
      // Or better: Send `address` as JSON string and verify backend parses it.
      // Wait, backend `nurseAuthController.js` doesn't seem to have `address` parsing logic in `updateNurseProfile`.
      // It just passes `updates` to `updateProfileByRoleAndId`.
      // `updateProfileByRoleAndId` likely uses `findByIdAndUpdate`.
      // If `req.body` is flats from multer, `updateProfileByRoleAndId` will fail to update nested `address`.
      // So I will convert address to JSON string and update backend to parse it?
      // Actually, looking at `updateNurseProfile` in `nurseAuthController.js`, it does `const updates = { ...req.body }`.
      // If I send JSON object via `apiClient.put` (axios), and handle file separately?
      // BUT `handleProfileImageChange` needs to upload image.
      // The user wants image to be uploaded.
      // If I use FormData, I can send image + data.
      // Solution: I will modify `handleSave` to try passing JSON fields normally if NO image is selected,
      // but if image is selected, use FormData. 
      // If I use FormData, I need to make sure backend handles the complex fields.
      // Let's rely on flattened keys for address: 'address.line1', 'address.city' etc? Mongoose update usually handles dot notation keys!
      // Yes! `Nurse.findOneAndUpdate(..., { 'address.line1': '...' })` works!
      // So I will append 'address.line1' etc to FormData.

      if (formData.address) {
        if (formData.address.line1) formDataToSend.append('address.line1', formData.address.line1)
        if (formData.address.city) formDataToSend.append('address.city', formData.address.city)
        if (formData.address.state) formDataToSend.append('address.state', formData.address.state)
        if (formData.address.postalCode) formDataToSend.append('address.postalCode', formData.address.postalCode)
      }

      // Availability - always send (even if empty array) so backend can update it
      formDataToSend.append('availability', JSON.stringify(formData.availability || []))

      // Profile Image
      if (selectedImage) {
        formDataToSend.append('profileImage', selectedImage)
      }

      const response = await updateNurseProfile(formDataToSend)
      if (response.success) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        setActiveSection(null)
        // Refresh profile to get updated URLs
        // window.location.reload() // Or just re-fetch? reloading is safer for images
        // We'll trust the response for now or maybe just reload to be sure
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }


  const handleToggleActive = async () => {
    const newActiveStatus = !formData.isActive
    const updatedFormData = { ...formData, isActive: newActiveStatus }
    setFormData(updatedFormData)

    try {
      // Update backend immediately
      const response = await updateNurseProfile({ isActive: newActiveStatus })

      if (response.success) {
        if (newActiveStatus) {
          toast.success('Your profile is now active and visible to patients.')
        } else {
          toast.info('Your profile is now inactive and will not be visible to patients.')
        }
      } else {
        // Revert on error
        setFormData(formData)
        toast.error(response.message || 'Failed to update profile status')
      }
    } catch (error) {
      // Revert on error
      setFormData(formData)
      console.error('Error updating profile status:', error)
      toast.error(error.message || 'Failed to update profile status. Please try again.')
    }
  }


  const handleCancel = () => {
    setIsEditing(false)
    setActiveSection(null)
    window.location.reload()
  }

  // Compute full name from firstName and lastName
  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Nurse'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-24 lg:pb-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#11496c] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:mx-auto lg:px-4 w-full">
        {/* Left Column - Profile Header Card (Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4">
            {/* Profile Header - Desktop Enhanced */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-5 shadow-xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              {/* Active Status - Top Right Corner */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-lg ${formData.isActive
                    ? 'bg-emerald-500/95 backdrop-blur-sm text-white border border-emerald-400/50 hover:bg-emerald-500'
                    : 'bg-slate-500/95 backdrop-blur-sm text-white border border-slate-400/50 hover:bg-slate-500'
                    }`}
                >
                  {formData.isActive ? (
                    <>
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <IoPowerOutline className="h-3.5 w-3.5" />
                      <span>Inactive</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-white/80 text-right whitespace-nowrap drop-shadow-md">
                  {formData.isActive ? 'Visible to patients' : 'Hidden from patients'}
                </p>
              </div>

              <div className="relative flex flex-col items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative h-24 w-24">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="nurse-profile-image-input"
                    />
                    <img
                      src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=11496c&size=128&bold=true`}
                      alt={fullName}
                      className="h-full w-full rounded-full object-cover ring-4 ring-white/50 shadow-2xl bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <label
                        htmlFor="nurse-profile-image-input"
                        className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#11496c] shadow-xl transition hover:bg-slate-50 hover:scale-110 cursor-pointer"
                      >
                        <IoCameraOutline className="h-5 w-5" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white mb-1.5">
                    {fullName}
                  </h1>
                  <p className="text-sm text-white/90 mb-3">
                    {formData.email || 'No email'}
                  </p>

                  {/* Specialization Badge */}
                  {formData.specialization && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/30 mb-2">
                      <IoMedicalOutline className="h-3.5 w-3.5" />
                      {formData.specialization}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 hover:scale-105"
                      >
                        <IoCloseOutline className="h-4 w-4" />
                        Cancel
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
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            try {
                              const { logoutNurse } = await import('../nurse-services/nurseService')
                              await logoutNurse()
                              toast.success('Logged out successfully')
                            } catch (error) {
                              console.error('Error during logout:', error)
                              const { clearNurseTokens } = await import('../nurse-services/nurseService')
                              clearNurseTokens()
                              toast.success('Logged out successfully')
                            }
                            setTimeout(() => {
                              window.location.href = '/nurse/login'
                            }, 500)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoLogOutOutline className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Header - Mobile */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-6 sm:p-8 shadow-lg lg:hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              {/* Active Status - Top Right Corner */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-lg ${formData.isActive
                    ? 'bg-emerald-500/95 backdrop-blur-sm text-white border border-emerald-400/50 hover:bg-emerald-500'
                    : 'bg-slate-500/95 backdrop-blur-sm text-white border border-slate-400/50 hover:bg-slate-500'
                    }`}
                >
                  {formData.isActive ? (
                    <>
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <IoPowerOutline className="h-3.5 w-3.5" />
                      <span>Inactive</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex flex-col items-center gap-4 sm:gap-5">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="nurse-profile-image-input-mobile"
                    />
                    <img
                      src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=11496c&size=128&bold=true`}
                      alt={fullName}
                      className="h-full w-full rounded-full object-cover ring-2 ring-white/50 shadow-lg bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <label
                        htmlFor="nurse-profile-image-input-mobile"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#11496c] shadow-lg transition hover:bg-slate-50 cursor-pointer"
                      >
                        <IoCameraOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-xl sm:text-2xl font-bold text-white text-center">
                  {fullName}
                </h1>

                {/* Email */}
                <p className="text-sm sm:text-base text-white/90 text-center truncate max-w-full">
                  {formData.email || 'No email'}
                </p>

                {/* Specialization Badge */}
                {formData.specialization && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-white border border-white/30">
                    <IoMedicalOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {formData.specialization}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2.5 sm:gap-3 mt-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoCloseOutline className="h-4 w-4" />
                        Cancel
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
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            try {
                              const { logoutNurse } = await import('../nurse-services/nurseService')
                              await logoutNurse()
                              toast.success('Logged out successfully')
                            } catch (error) {
                              console.error('Error during logout:', error)
                              const { clearNurseTokens } = await import('../nurse-services/nurseService')
                              clearNurseTokens()
                              toast.success('Logged out successfully')
                            }
                            setTimeout(() => {
                              window.location.href = '/nurse/login'
                            }, 500)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoLogOutOutline className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Right Column - Information Sections */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">

            {/* Basic Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'basic' ? null : 'basic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">🧑‍⚕️ Basic Details</h2>
                {(activeSection === 'basic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'basic' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.firstName || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.lastName || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoMailOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{formData.email || '—'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Mobile Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          maxLength={10}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formData.phone || '—'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'address' ? null : 'address')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">📍 Address Details</h2>
                {(activeSection === 'address' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'address' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Complete Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.line1}
                          onChange={(e) => handleInputChange('address.line1', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.line1 || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.city || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.state || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Pincode
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.postalCode}
                          onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                          maxLength={6}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.postalCode || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'professional' ? null : 'professional')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">🎓 Professional Details</h2>
                {(activeSection === 'professional' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'professional' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Qualification
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="GNM, B.Sc Nursing, ANM, D.Pharm, etc."
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.qualification || '—'}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Write about your professional background, experience, and expertise..."
                          rows={4}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] resize-y"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{formData.bio || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Experience (Years)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.experienceYears || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Specialization (if any)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          placeholder="ICU, OT, Emergency, Pediatrics, etc."
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.specialization || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Fees (₹)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.fees}
                          onChange={(e) => handleInputChange('fees', e.target.value)}
                          placeholder="500"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <input /* Readonly view */
                          readOnly
                          value={formData.fees ? `₹${formData.fees}` : '—'}
                          className="w-full rounded-md border-0 bg-transparent px-0 py-1.5 text-sm font-medium text-slate-900 focus:ring-0"
                        />
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Availability (Days)
                      </label>
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <label key={day} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={formData.availability?.includes(day)}
                                onChange={() => handleAvailabilityChange(day)}
                                className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                              />
                              <span className="text-sm font-medium text-slate-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {formData.availability && formData.availability.length > 0 ? (
                            formData.availability.map((day) => (
                              <span key={day} className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {day}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm font-semibold text-slate-900">—</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.registrationNumber}
                          onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.registrationNumber || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration Council/Board Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.registrationCouncilName}
                          onChange={(e) => handleInputChange('registrationCouncilName', e.target.value)}
                          placeholder="e.g., Indian Nursing Council"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.registrationCouncilName || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Documents */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'documents' ? null : 'documents')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Uploaded Documents</h2>
                {activeSection === 'documents' ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {activeSection === 'documents' && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-2 pt-4 sm:pt-5">
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
            </div>
          </div>
      </div>
    </div>
  )
}

export default NurseProfile
