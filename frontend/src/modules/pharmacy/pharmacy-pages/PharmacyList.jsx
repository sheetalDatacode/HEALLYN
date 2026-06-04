import { useEffect, useMemo, useState, useRef } from 'react'
import { HiChevronDown } from 'react-icons/hi'
import {
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoStar,
  IoStarOutline,
} from 'react-icons/io5'
import { getDiscoveryPharmacies } from '../../patient/patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

// Removed mock data - now using backend API

const DELIVERY_LABELS = {
  pickup: 'In-pharmacy pickup',
  delivery: 'Home delivery',
  both: 'Pickup & delivery',
}

const normalizePhone = (phone) => phone.replace(/[^+\d]/g, '')

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-3 w-3 text-amber-400" />)
  }

  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-3 w-3 text-amber-400" />)
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<IoStarOutline key={`empty-${i}`} className="h-3 w-3 text-slate-300" />)
  }

  return stars
}

const CustomDropdown = ({ id, value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 120),
      })
    }
  }

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      calculatePosition()
      const timeoutId = setTimeout(calculatePosition, 10)

      return () => {
        document.removeEventListener('keydown', handleEscape)
        clearTimeout(timeoutId)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const updatePosition = () => {
        calculatePosition()
      }

      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)

      const intervalId = setInterval(updatePosition, 100)

      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
        clearInterval(intervalId)
      }
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <>
      <div className={`relative z-0 shrink-0 min-w-[120px] ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex w-full items-center justify-between rounded-lg border bg-white/95 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all ${
            isOpen
              ? 'border-[#11496c] bg-white shadow-md ring-2 ring-[rgba(17,73,108,0.2)]'
              : 'border-[rgba(17,73,108,0.2)] hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate text-xs">{selectedOption?.label || 'Select...'}</span>
          <HiChevronDown
            className={`ml-1.5 h-3 w-3 flex-shrink-0 text-[#11496c] transition-all duration-200 ${
              isOpen ? 'rotate-180 text-[#0d3a52]' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[9999] rounded-lg border-2 border-[rgba(17,73,108,0.3)] bg-white shadow-2xl"
            style={{
              top: position.top > 0 ? `${position.top}px` : '50%',
              left: position.left > 0 ? `${position.left}px` : '50%',
              width: position.width > 0 ? `${position.width}px` : '200px',
              maxHeight: '12rem',
              transform: position.top === 0 ? 'translate(-50%, -50%)' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ul
              role="listbox"
              className="max-h-48 overflow-auto py-1.5"
              aria-labelledby={id}
            >
              {options.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                  className={`cursor-pointer px-3 py-2 text-xs font-medium transition-colors ${
                    value === option.value
                      ? 'bg-[rgba(17,73,108,0.15)] text-[#11496c] font-semibold'
                      : 'bg-white text-slate-700 hover:bg-[rgba(17,73,108,0.1)]'
                  }`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}

const PharmacyList = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState('all')
  const [radiusFilter, setRadiusFilter] = useState('any')
  const [showOnlyApproved, setShowOnlyApproved] = useState(true)
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch pharmacies from API
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const filters = {
          approvedOnly: showOnlyApproved ? 'true' : 'false',
          deliveryOption: selectedDelivery !== 'all' ? selectedDelivery : undefined,
        }
        
        const response = await getDiscoveryPharmacies(filters)
        
        if (response.success && response.data) {
          const pharmaciesData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          
          // Transform API data
          const transformed = pharmaciesData.map(pharmacy => ({
            id: pharmacy._id || pharmacy.id,
            pharmacyName: pharmacy.pharmacyName || 'Pharmacy',
            status: pharmacy.status || 'pending',
            rating: pharmacy.rating || 0,
            reviewCount: pharmacy.reviewCount || 0,
            phone: pharmacy.phone || 'N/A',
            email: pharmacy.email || 'N/A',
            distanceKm: pharmacy.distance || 0,
            responseTimeMinutes: pharmacy.responseTimeMinutes || null,
            deliveryOptions: pharmacy.deliveryOptions || [],
            address: pharmacy.address || {},
            lastUpdated: pharmacy.updatedAt || pharmacy.createdAt || new Date().toISOString(),
          }))
          
          setPharmacies(transformed)
        }
      } catch (err) {
        console.error('Error fetching pharmacies:', err)
        setError(err.message || 'Failed to load pharmacies')
        toast.error('Failed to load pharmacies')
      } finally {
        setLoading(false)
      }
    }

    fetchPharmacies()
  }, [showOnlyApproved, selectedDelivery, toast])

  const filteredPharmacies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const matchesSearch = (pharmacy) => {
      if (!normalizedSearch) return true

      const haystack = [
        pharmacy.pharmacyName,
        pharmacy.address?.line1,
        pharmacy.address?.line2,
        pharmacy.address?.city,
        pharmacy.address?.state,
        pharmacy.address?.postalCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    }

    return pharmacies
      .filter((pharmacy) => {
        if (radiusFilter !== 'any') {
          const limit = Number.parseInt(radiusFilter, 10)
          const distance = typeof pharmacy.distanceKm === 'number' ? pharmacy.distanceKm : Number.POSITIVE_INFINITY
          if (distance > limit) {
            return false
          }
        }

        return matchesSearch(pharmacy)
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
  }, [pharmacies, radiusFilter, searchTerm])

  return (
    <section className="flex flex-col gap-3 px-2 pb-4 pt-2 sm:px-3 sm:pb-6 sm:pt-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#11496c]">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="pharmacy-search"
            type="search"
            placeholder="Search by name, service, or medicine..."
            className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] sm:text-base"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {/* Filters - Scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <CustomDropdown
          className="shrink-0"
          id="delivery-filter"
          value={selectedDelivery}
          onChange={(value) => setSelectedDelivery(value)}
          options={[
            { value: 'all', label: 'All options' },
            { value: 'delivery', label: 'Home delivery' },
            { value: 'pickup', label: 'In-pharmacy pickup' },
          ]}
        />

        <CustomDropdown
          className="shrink-0"
          id="status-filter"
          value={showOnlyApproved ? 'approved' : 'all'}
          onChange={(value) => setShowOnlyApproved(value === 'approved')}
          options={[
            { value: 'approved', label: 'Approved only' },
            { value: 'all', label: 'Include pending' },
          ]}
        />

        <CustomDropdown
          className="shrink-0"
          id="radius-filter"
          value={radiusFilter}
          onChange={(value) => setRadiusFilter(value)}
          options={[
            { value: 'any', label: 'Any dist' },
            { value: '5', label: 'Up to 5 km' },
            { value: '10', label: 'Up to 10 km' },
            { value: '20', label: 'Up to 20 km' },
          ]}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Loading pharmacies...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
          <p className="mt-1 text-xs text-red-500">Please try again later.</p>
        </div>
      )}

      {/* Pharmacy Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4">
          {filteredPharmacies.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No pharmacies match your filters. Try expanding the radius or clearing the delivery preference.
          </p>
        )}

        {filteredPharmacies.map((pharmacy) => (
          <article
            key={pharmacy.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          >
            <div className="flex flex-col gap-2 sm:max-w-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    {pharmacy.pharmacyName}
                  </h3>
                  {typeof pharmacy.rating === 'number' && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(pharmacy.rating)}</div>
                      <span className="text-xs font-semibold text-slate-700">{pharmacy.rating.toFixed(1)}</span>
                      {pharmacy.reviewCount && (
                        <span className="text-xs text-slate-500">({pharmacy.reviewCount})</span>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{formatAddress(pharmacy.address)}</p>
                  <p className="text-xs font-medium text-slate-600">
                    {pharmacy.distanceKm?.toFixed
                      ? `${pharmacy.distanceKm.toFixed(1)} km away`
                      : 'Distance unavailable'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      pharmacy.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {pharmacy.status === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(pharmacy.deliveryOptions || []).map((option) => (
                  <span
                    key={`${pharmacy.id}-${option}`}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                  >
                    {DELIVERY_LABELS[option] || option}
                  </span>
                ))}
                {pharmacy.responseTimeMinutes && (
                  <span className="rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-1 text-[10px] font-medium text-[#11496c]">
                    ~{pharmacy.responseTimeMinutes} min response
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-1 sm:items-end sm:text-right">
              <p className="text-[11px] text-slate-500">
                Updated {formatDateTime(pharmacy.lastUpdated)}
              </p>
              <div className="flex flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                >
                  <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                  Book
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
                >
                  View
                </button>
                <a
                  href={`tel:${normalizePhone(pharmacy.phone)}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Call"
                >
                  <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={`mailto:${pharmacy.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Email"
                >
                  <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.pharmacyName} ${formatAddress(pharmacy.address)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Map"
                >
                  <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        ))}
        </div>
      )}
    </section>
  )
}

export default PharmacyList




