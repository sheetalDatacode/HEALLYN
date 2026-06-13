import { useState, useEffect } from 'react';
import {
  IoAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoImageOutline,
} from 'react-icons/io5';
import { getDoctorCategories, createDoctorCategory, updateDoctorCategory, deleteDoctorCategory } from '../admin-services/adminService';
import { useToast } from '../../../contexts/ToastContext';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getDoctorCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', image: '', isActive: true });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('isActive', formData.isActive);
      
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingCategory) {
        await updateDoctorCategory(editingCategory._id, payload);
        toast.success('Category updated successfully');
      } else {
        await createDoctorCategory(payload);
        toast.success('Category created successfully');
      }
      
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Action failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoctorCategory(id);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  if (loading) return <div className="p-8">Loading categories...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Doctor Categories</h1>
          <p className="text-sm font-medium text-slate-500">Manage specialties/categories for doctors</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#11496c] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0d3a52] transition-colors flex items-center gap-2"
        >
          <IoAddOutline className="text-xl" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="p-4 pl-6">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 pl-6">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <IoImageOutline className="text-2xl" />
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-800">{cat.name}</p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-[#11496c] hover:bg-blue-50 rounded-lg transition-colors">
                      <IoPencilOutline className="text-xl" />
                    </button>
                    <button onClick={() => handleDelete(cat._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <IoTrashOutline className="text-xl" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                <IoCloseOutline className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#11496c] font-medium text-slate-800"
                  placeholder="e.g. Cardiology"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#11496c]"
                />
                {(imageFile || formData.image) && (
                  <div className="mt-3 p-2 border-2 border-slate-100 rounded-xl inline-block">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 object-contain rounded-md" />
                    ) : (
                      <img src={formData.image} alt="Current" className="h-16 object-contain rounded-md" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
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
                disabled={uploading}
                className="w-full bg-[#11496c] text-white py-4 rounded-xl font-black text-lg hover:bg-[#0d3a52] transition-colors mt-4 disabled:opacity-50"
              >
                {uploading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Save Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
