import { useState, useEffect } from 'react';
import {
  IoAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';
import { 
  getDoctorSubcategories, 
  getDoctorCategories,
  createDoctorSubcategory, 
  updateDoctorSubcategory, 
  deleteDoctorSubcategory,
  approveDoctorSubcategory
} from '../admin-services/adminService';
import { useToast } from '../../../contexts/ToastContext';

const AdminSubcategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, catRes] = await Promise.all([
        getDoctorSubcategories(),
        getDoctorCategories()
      ]);
      if (subRes.success) setSubcategories(subRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (subcategory = null) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setFormData({
        name: subcategory.name,
        category: subcategory.category?._id || subcategory.category,
        description: subcategory.description || '',
        isActive: subcategory.isActive,
      });
      setImagePreview(subcategory.image || null);
    } else {
      setEditingSubcategory(null);
      setFormData({ name: '', category: categories[0]?._id || '', description: '', isActive: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubcategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('category', formData.category);
      submitData.append('isActive', formData.isActive);
      
      if (!editingSubcategory) {
        submitData.append('isApproved', true); // Admin creates approved ones
      }
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingSubcategory) {
        await updateDoctorSubcategory(editingSubcategory._id, submitData);
        toast.success('Subcategory updated successfully');
      } else {
        await createDoctorSubcategory(submitData);
        toast.success('Subcategory created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subcategory (symptom)?')) {
      try {
        await deleteDoctorSubcategory(id);
        toast.success('Subcategory deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete subcategory');
      }
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this symptom? Doctors will be able to select it.')) {
      try {
        await approveDoctorSubcategory(id);
        toast.success('Symptom approved!');
        fetchData();
      } catch (error) {
        toast.error('Failed to approve');
      }
    }
  };

  if (loading) return <div className="p-8">Loading symptoms/subcategories...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Symptoms (Subcategories)</h1>
          <p className="text-sm font-medium text-slate-500">Manage symptoms and approve new ones added by doctors</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#11496c] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0d3a52] transition-colors flex items-center gap-2"
        >
          <IoAddOutline className="text-xl" /> Add Symptom
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="p-4 pl-6">Symptom Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Approval</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subcategories.map((sub) => (
              <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 pl-6 font-bold text-slate-800">{sub.name}</td>
                <td className="p-4 text-slate-600 font-medium">
                  {sub.category?.name || 'Unknown Category'}
                </td>
                <td className="p-4">
                  {sub.isApproved ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center w-max gap-1">
                      <IoCheckmarkCircleOutline className="text-sm" /> Approved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center w-max gap-1">
                      Pending Review
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {sub.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex justify-end gap-2">
                    {!sub.isApproved && (
                      <button onClick={() => handleApprove(sub._id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm">
                        Approve
                      </button>
                    )}
                    <button onClick={() => handleOpenModal(sub)} className="p-2 text-[#11496c] hover:bg-blue-50 rounded-lg transition-colors">
                      <IoPencilOutline className="text-xl" />
                    </button>
                    <button onClick={() => handleDelete(sub._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <IoTrashOutline className="text-xl" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subcategories.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No symptoms found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">{editingSubcategory ? 'Edit Symptom' : 'Add Symptom'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                <IoCloseOutline className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Symptom Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#11496c] font-medium text-slate-800"
                  placeholder="e.g. Chest Pain"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#11496c] font-medium text-slate-800 bg-white"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Symptom Image</label>
                <div className="flex items-center gap-4">
                  {(imagePreview) && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border-2 border-slate-100"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#11496c]/10 file:text-[#11496c] hover:file:bg-[#11496c]/20 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded text-[#11496c] focus:ring-[#11496c]"
                />
                <label htmlFor="isActive" className="font-bold text-slate-700">Active</label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#11496c] text-white py-4 rounded-xl font-black text-lg hover:bg-[#0d3a52] transition-colors mt-4 shadow-lg shadow-[#11496c]/20"
              >
                {editingSubcategory ? 'Update Symptom' : 'Save Symptom'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubcategories;
