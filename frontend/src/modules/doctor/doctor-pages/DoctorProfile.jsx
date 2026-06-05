import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDoctorProfile, updateDoctorProfile, getSupportHistory, uploadProfileImage, uploadSignature } from '../doctor-services/doctorService'
import { useToast } from '../../../contexts/ToastContext'
import DoctorPersonalInformation from '../doctor-components/profile/DoctorPersonalInformation'
import ProfessionalDetails from '../doctor-components/profile/ProfessionalDetails'
import ClinicInformation from '../doctor-components/profile/ClinicInformation'
import SessionsAndTimings from '../doctor-components/profile/SessionsAndTimings'
import VerificationAndDocuments from '../doctor-components/profile/VerificationAndDocuments'
import { getAuthToken } from '../../../utils/apiClient'

import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoMedicalOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoBriefcaseOutline,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoImageOutline,
  IoPowerOutline,
  IoVideocamOutline,
} from 'react-icons/io5'

// Mock data removed - using real backend data now

// Utility function to normalize image URLs (remove /api from base URL for static files)
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
  
  // Get base URL without /api for static file serving
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const baseUrl = apiBaseUrl.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}${cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`}`
}



// Utility function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';

  // If already in 12-hour format (contains AM/PM), return as is
  if (time24.toString().includes('AM') || time24.toString().includes('PM')) {
    return time24;
  }

  // Handle time format like "17:00" or "17:00:00"
  const timeStr = time24.toString().trim();
  const [hours, minutes] = timeStr.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) return time24;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${hours12}:${minutesStr} ${period}`;
};

// Utility function to convert 12-hour format to 24-hour format for time inputs
const convert12HourTo24Hour = (time12) => {
  if (!time12) return '';

  // If already in 24-hour format (no AM/PM), return as is
  if (!time12.toString().includes('AM') && !time12.toString().includes('PM')) {
    return time12;
  }

  const timeStr = time12.toString().trim();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (!match) return time12;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const DoctorProfile = () => {
  const location = useLocation()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const languageInputRef = useRef(null)
  // Store stable averageConsultationMinutes value to prevent it from changing unexpectedly
  const [stableAverageConsultationMinutes, setStableAverageConsultationMinutes] = useState(20)



  // Initialize with empty/default data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    profileImage: '',
    specialization: '',
    licenseNumber: '',
    experienceYears: 0,
    qualification: '',
    bio: '',
    consultationFee: 0,
    education: [],
    languages: [],
    consultationModes: [],
    clinicDetails: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    availableTimings: [],
    availability: [],
    averageConsultationMinutes: 20,
    documents: {},
    digitalSignature: {
      imageUrl: '',
      uploadedAt: null,
    },
    status: 'pending',
    rating: 0,
    isActive: true,
  })

  // Fetch doctor profile using React Query
  const token = getAuthToken('doctor')
  
  const { data: queryProfileData, isLoading: isLoadingQuery } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: async () => {
      const response = await getDoctorProfile()
      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'Failed to load profile data')
      }
      return response.data.doctor || response.data
    },
    enabled: !!token,
    onError: (error) => {
      console.error('Error fetching doctor profile:', error)
      toast.error('Failed to load profile data. Please refresh the page.')
    }
  })

  const isLoading = isLoadingQuery

  useEffect(() => {
    if (queryProfileData) {
      const doctor = queryProfileData
      
      const transformedData = {
        firstName: doctor.firstName || '',
        lastName: doctor.lastName || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        gender: doctor.gender || '',
        profileImage: normalizeImageUrl(doctor.profileImage || doctor.documents?.profileImage || ''),
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        experienceYears: doctor.experienceYears || 0,
        qualification: doctor.qualification || '',
        bio: doctor.bio || '',
        consultationFee: doctor.consultationFee || 0,
        education: Array.isArray(doctor.education) ? doctor.education : [],
        languages: Array.isArray(doctor.languages) ? doctor.languages : [],
        consultationModes: Array.isArray(doctor.consultationModes) ? doctor.consultationModes : [],
        clinicDetails: doctor.clinicDetails || {
          name: '',
          address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
        },
        availableTimings: Array.isArray(doctor.availableTimings) ? doctor.availableTimings : [],
        availability: Array.isArray(doctor.availability)
          ? doctor.availability.map(avail => ({
            ...avail,
            // Convert 12-hour format from database to 24-hour format for time inputs
            startTime: convert12HourTo24Hour(avail.startTime),
            endTime: convert12HourTo24Hour(avail.endTime),
          }))
          : [],
        averageConsultationMinutes: doctor.averageConsultationMinutes || 20,
        documents: doctor.documents && Array.isArray(doctor.documents) ? doctor.documents : [],
        digitalSignature: doctor.digitalSignature ? {
          imageUrl: normalizeImageUrl(doctor.digitalSignature.imageUrl || ''),
          uploadedAt: doctor.digitalSignature.uploadedAt || null,
        } : {
          imageUrl: '',
          uploadedAt: null,
        },
        status: doctor.status || 'pending',
        rating: doctor.rating || 0,
        isActive: doctor.isActive !== undefined ? doctor.isActive : true,
      }

      setFormData(transformedData)
      setStableAverageConsultationMinutes(doctor.averageConsultationMinutes || 20)

      // Keep localStorage updated for fallback where components might check it directly
      const storage = localStorage.getItem('doctorAuthToken') ? localStorage : sessionStorage
      storage.setItem('doctorProfile', JSON.stringify(doctor))
    }
  }, [queryProfileData])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
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

  const handleArrayAdd = (field, newItem) => {
    if (!newItem || (typeof newItem === 'string' && !newItem.trim())) {
      return
    }
    setFormData((prev) => {
      const currentArray = prev[field] || []
      // For languages, check if it already exists (case-insensitive)
      if (field === 'languages' && typeof newItem === 'string') {
        const exists = currentArray.some(
          item => typeof item === 'string' && item.toLowerCase().trim() === newItem.toLowerCase().trim()
        )
        if (exists) {
          return prev // Don't add duplicate
        }
      }
      return {
        ...prev,
        [field]: [...currentArray, newItem],
      }
    })
  }

  const handleArrayRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleArrayItemChange = (field, index, subField, value) => {
    setFormData((prev) => {
      const updated = [...(prev[field] || [])]
      updated[index] = { ...updated[index], [subField]: value }
      return { ...prev, [field]: updated }
    })
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    try {
      toast.info('Uploading image...')
      const response = await uploadProfileImage(file)

      if (response.success && response.data?.url) {
        const imageUrl = normalizeImageUrl(response.data.url)
        setFormData((prev) => ({
          ...prev,
          profileImage: imageUrl,
        }))
        toast.success('Profile image uploaded successfully!')
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      toast.error(error.message || 'Failed to upload profile image')
    }
  }

  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    try {
      // Upload the image directly
      toast.info('Uploading signature...')
      const response = await uploadSignature(file)

      if (response.success && response.data?.url) {
        const imageUrl = normalizeImageUrl(response.data.url)
        setFormData((prev) => ({
          ...prev,
          digitalSignature: {
            imageUrl: imageUrl,
            uploadedAt: new Date(),
          },
        }))
        toast.success('Signature uploaded successfully!')
      }
    } catch (error) {
      console.error('Error uploading signature:', error)
      toast.error(error.message || 'Failed to upload signature')
    }

    // Reset file input
    event.target.value = ''
  }

  const handleRemoveSignature = () => {
    setFormData((prev) => ({
      ...prev,
      digitalSignature: {
        imageUrl: '',
        uploadedAt: null,
      },
    }))
  }

  // Helper function to convert 24-hour format to 12-hour format for storage
  const convertTo12HourForStorage = (time24) => {
    if (!time24) return ''

    // Handle both "HH:MM" and "HH:MM:SS" formats
    const [hours, minutes] = time24.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return time24

    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12 // Convert 0 to 12 for 12 AM
    const minutesStr = minutes.toString().padStart(2, '0')

    return `${hours12}:${minutesStr} ${period}`
  }

  const handleSave = async () => {
    const token = getAuthToken('doctor')
    if (!token) {
      toast.error('Please login to save profile')
      return
    }

    try {
      setIsSaving(true)

      // Convert availability times from 24-hour to 12-hour format before saving
      const availability12Hour = formData.availability.map(avail => ({
        ...avail,
        startTime: convertTo12HourForStorage(avail.startTime),
        endTime: convertTo12HourForStorage(avail.endTime),
      }))

      // Prepare data for backend (match backend expected format)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        profileImage: formData.profileImage,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        experienceYears: formData.experienceYears,
        qualification: formData.qualification,
        bio: formData.bio,
        consultationFee: formData.consultationFee,
        education: formData.education,
        languages: formData.languages,
        consultationModes: formData.consultationModes,
        clinicDetails: formData.clinicDetails,
        availableTimings: formData.availableTimings,
        availability: availability12Hour, // Use converted 12-hour format
        averageConsultationMinutes: formData.averageConsultationMinutes,
        documents: formData.documents,
        digitalSignature: formData.digitalSignature,
        isActive: formData.isActive,
      }

      const response = await updateDoctorProfile(updateData)

      if (response.success) {
        // Update cache
        const storage = localStorage.getItem('doctorAuthToken') ? localStorage : sessionStorage
        const savedDoctor = response.data?.doctor || response.data
        storage.setItem('doctorProfile', JSON.stringify(savedDoctor))
        storage.setItem('doctorProfileActive', JSON.stringify(formData.isActive))

        // Update stable value with saved value
        if (savedDoctor?.averageConsultationMinutes !== undefined) {
          setStableAverageConsultationMinutes(savedDoctor.averageConsultationMinutes)
        } else if (formData.averageConsultationMinutes !== undefined) {
          setStableAverageConsultationMinutes(formData.averageConsultationMinutes)
        }

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

  const handleToggleActive = async () => {
    const newActiveStatus = !formData.isActive
    const updatedFormData = { ...formData, isActive: newActiveStatus }
    setFormData(updatedFormData)

    try {
      // Update backend immediately
      const response = await updateDoctorProfile({ isActive: newActiveStatus })

      if (response.success) {
        // Update cache
        const storage = localStorage.getItem('doctorAuthToken') ? localStorage : sessionStorage
        storage.setItem('doctorProfile', JSON.stringify(response.data?.doctor || response.data || updatedFormData))
        storage.setItem('doctorProfileActive', JSON.stringify(newActiveStatus))

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

  const handleCancel = async () => {
    // Reload original data from backend
    try {
      const response = await getDoctorProfile()
      if (response.success && response.data) {
        const doctor = response.data.doctor || response.data
        const transformedData = {
          firstName: doctor.firstName || '',
          lastName: doctor.lastName || '',
          email: doctor.email || '',
          phone: doctor.phone || '',
          gender: doctor.gender || '',
          profileImage: doctor.profileImage || doctor.documents?.profileImage || '',
          specialization: doctor.specialization || '',
          licenseNumber: doctor.licenseNumber || '',
          experienceYears: doctor.experienceYears || 0,
          qualification: doctor.qualification || '',
          bio: doctor.bio || '',
          consultationFee: doctor.consultationFee || 0,
          education: Array.isArray(doctor.education) ? doctor.education : [],
          languages: Array.isArray(doctor.languages) ? doctor.languages : [],
          consultationModes: Array.isArray(doctor.consultationModes) ? doctor.consultationModes : [],
          clinicDetails: doctor.clinicDetails || {
            name: '',
            address: {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
          },
          availableTimings: Array.isArray(doctor.availableTimings) ? doctor.availableTimings : [],
          availability: Array.isArray(doctor.availability) ? doctor.availability : [],
          averageConsultationMinutes: doctor.averageConsultationMinutes || 20,
          documents: doctor.documents || {},
          digitalSignature: doctor.digitalSignature || {
            imageUrl: '',
            uploadedAt: null,
          },
          status: doctor.status || 'pending',
          rating: doctor.rating || 0,
          isActive: doctor.isActive !== undefined ? doctor.isActive : true,
        }
        setFormData(transformedData)
        // Update stable value when profile is reloaded
        setStableAverageConsultationMinutes(doctor.averageConsultationMinutes || 20)
      }
    } catch (error) {
      console.error('Error reloading profile:', error)
      toast.error('Failed to reload profile data')
    }
    setIsEditing(false)
    setActiveSection(null)
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <section className={`flex flex-col gap-4 pb-24 lg:pb-8 ${isDashboardPage ? '-mt-28' : ''} lg:mt-0`}>
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

  return (
    <>
      <section className={`flex flex-col gap-6 pb-24 px-4 lg:pb-8 ${isDashboardPage ? '-mt-28' : 'pt-4'} lg:mt-0`}>
        {/* Header Section (Mobile) */}
        <div className="lg:hidden flex items-center justify-between px-1">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Identity</p>
          </div>
          <button
            type="button"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              isEditing ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-[#11496c] text-white shadow-[#11496c]/20'
            }`}
          >
            {isEditing ? <IoCheckmarkCircleOutline className="h-4 w-4" /> : <IoCreateOutline className="h-4 w-4" />}
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Main Layout: Two Column Grid */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:max-w-7xl lg:mx-auto w-full">
          {/* Left Column - Profile Summary Card */}
          <div className="lg:col-span-4 mb-6 lg:mb-0">
            <div className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-xl shadow-[#11496c]/20 sticky top-4"
              style={{ background: 'linear-gradient(135deg, #11496c 0%, #0d3a52 60%, #14B8A6 100%)' }}>
              {/* Mesh Gradient Effect */}
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
              <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Active Toggle */}
                <div className="absolute -top-1 -right-1">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] transition-all border backdrop-blur-md ${
                      formData.isActive
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                        : 'bg-white/10 border-white/20 text-white/60'
                    }`}
                  >
                    <div className={`h-1 w-1 rounded-full ${formData.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    {formData.isActive ? 'Active' : 'Offline'}
                  </button>
                </div>

                {/* Profile Picture */}
                <div className="group relative mb-4 mt-2">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                    <img
                      src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((formData.firstName + ' ' + formData.lastName).trim() || 'Doctor')}&background=ffffff&color=11496c&size=256&bold=true`}
                      alt="Doctor Profile"
                      className="h-full w-full rounded-[24px] object-cover ring-4 ring-white/10 shadow-xl transition-transform duration-500 group-hover:scale-105"
                    />
                    {isEditing && (
                      <label htmlFor="profile-image-input-main" className="absolute -bottom-1 -right-1 h-9 w-9 rounded-xl bg-white text-[#11496c] shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95">
                        <IoCameraOutline className="h-4.5 w-4.5" />
                        <input type="file" id="profile-image-input-main" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white leading-tight tracking-tight">
                  {formData.firstName ? `Dr. ${formData.firstName} ${formData.lastName}` : 'Doctor Name'}
                </h2>
                <p className="text-xs font-semibold text-white/60 mt-0.5 uppercase tracking-wider">{formData.specialization || 'Specialist'}</p>

                <div className="mt-5 w-full space-y-2">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[16px] bg-white/10 border border-white/20 backdrop-blur-md">
                    <IoMailOutline className="h-4 w-4 text-white/60" />
                    <span className="text-[11px] font-semibold text-white truncate">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[16px] bg-white/10 border border-white/20 backdrop-blur-md">
                    <IoCallOutline className="h-4 w-4 text-white/60" />
                    <span className="text-[11px] font-semibold text-white">{formData.phone || 'No phone added'}</span>
                  </div>
                </div>

                <div className="mt-5 w-full flex flex-row gap-2.5">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-[#11496c] text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#11496c] border-r-transparent" /> : <IoCheckmarkCircleOutline className="h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider border border-white/20 transition-all hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-2.5 rounded-xl bg-white text-[#11496c] text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            const { logoutDoctor } = await import('../doctor-services/doctorService')
                            await logoutDoctor()
                            window.location.href = '/login?type=doctor'
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-red-600"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Information Sections (Desktop) */}
          <div className="lg:col-span-8 lg:space-y-4">

            <DoctorPersonalInformation
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
            />

            <ProfessionalDetails
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              handleArrayItemChange={handleArrayItemChange}
              handleArrayRemove={handleArrayRemove}
              handleArrayAdd={handleArrayAdd}
              languageInputRef={languageInputRef}
            />

            <ClinicInformation
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              formatAddress={formatAddress}
            />

            <SessionsAndTimings
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              handleArrayItemChange={handleArrayItemChange}
              handleArrayRemove={handleArrayRemove}
              handleArrayAdd={handleArrayAdd}
              formatTimeTo12Hour={formatTimeTo12Hour}
            />

            <VerificationAndDocuments
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              formatDate={formatDate}
              handleSignatureUpload={handleSignatureUpload}
              handleRemoveSignature={handleRemoveSignature}
              normalizeImageUrl={normalizeImageUrl}
              getSupportHistory={getSupportHistory}
              useToast={useToast}
            />
            </div>
          </div>
        </section>
      </>
    )
  }
export default DoctorProfile