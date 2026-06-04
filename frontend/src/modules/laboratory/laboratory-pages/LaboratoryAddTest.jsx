import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  IoFlaskOutline,
} from 'react-icons/io5'
import { addLaboratoryTest, updateLaboratoryTest, getLaboratoryTests } from '../laboratory-services/laboratoryService'

const LaboratoryAddTest = () => {
  const navigate = useNavigate()
  const { testId } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (testId) {
      loadTestData()
    }
  }, [testId, navigate])

  const loadTestData = async () => {
    try {
      setIsLoading(true)
      const response = await getLaboratoryTests()
      const tests = Array.isArray(response) ? response : (response.data || response.tests || [])
      const test = tests.find(t => t.id === testId || t._id === testId)
      if (test) {
        setFormData({
          name: test.name || '',
          price: test.price || test.amount || '',
        })
        setIsEditing(true)
      } else {
        toast.error('Test not found')
        navigate('/laboratory/available-tests')
      }
    } catch (error) {
      console.error('Error loading test:', error)
      toast.error('Failed to load test data')
      navigate('/laboratory/available-tests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsLoading(true)
      const testData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price.trim()),
      }

      if (isEditing && testId) {
        await updateLaboratoryTest(testId, testData)
        toast.success('Test updated successfully!')
      } else {
        await addLaboratoryTest(testData)
        toast.success('Test added successfully!')
      }

      navigate('/laboratory/available-tests')
    } catch (error) {
      console.error('Error saving test:', error)
      toast.error(isEditing ? 'Failed to update test' : 'Failed to add test')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Test Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Complete Blood Count (CBC)"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 500"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/laboratory/available-tests')}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                isEditing ? 'Update Test' : 'Add Test'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default LaboratoryAddTest

