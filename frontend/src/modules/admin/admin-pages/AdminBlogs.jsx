import React, { useState, useEffect } from 'react'
import { IoAddOutline, IoPencilOutline, IoTrashOutline, IoSearchOutline, IoCloseOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../admin-services/adminService'
// import ReactQuill from 'react-quill' // Commented out to prevent crash until user installs it
// import 'react-quill/dist/quill.snow.css'

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    readTime: '',
    image: '',
    badge: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    seoKeywords: '',
    isActive: true
  })

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await getBlogs({ search })
      if (res.success) {
        setBlogs(res.data.items || [])
      }
    } catch (error) {
      toast.error('Failed to fetch blogs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [search])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // const handleContentChange = (content) => {
  //   setFormData(prev => ({ ...prev, content }))
  // }

  const handleOpenModal = (blog = null) => {
    if (blog) {
      setEditingId(blog._id)
      setFormData({
        title: blog.title || '',
        category: blog.category || '',
        readTime: blog.readTime || '',
        image: blog.image || '',
        badge: blog.badge || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        seoKeywords: blog.seoKeywords || '',
        isActive: blog.isActive !== undefined ? blog.isActive : true
      })
    } else {
      setEditingId(null)
      setFormData({
        title: '',
        category: '',
        readTime: '',
        image: '',
        badge: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        seoKeywords: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.category || !formData.content) {
      toast.error('Please fill required fields (Title, Category, Content)')
      return
    }

    try {
      setSubmitting(true)
      if (editingId) {
        await updateBlog(editingId, formData)
        toast.success('Blog updated successfully')
      } else {
        await createBlog(formData)
        toast.success('Blog created successfully')
      }
      handleCloseModal()
      fetchBlogs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save blog')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return

    try {
      await deleteBlog(id)
      toast.success('Blog deleted successfully')
      fetchBlogs()
    } catch (error) {
      toast.error('Failed to delete blog')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <p className="text-sm text-slate-500">Manage your platform's articles and blog posts.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#11496c] text-white rounded-xl hover:bg-[#0d3a52] transition-colors font-medium shadow-md"
        >
          <IoAddOutline className="w-5 h-5" />
          Add New Blog
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Blog Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading blogs...</td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No blogs found. Add your first post!</td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                          {blog.image ? (
                            <img src={blog.image} alt={blog.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">No Img</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 line-clamp-1">{blog.title}</div>
                          <div className="text-xs text-slate-500">{new Date(blog.createdAt).toLocaleDateString()} • {blog.readTime || '5 min'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {blog.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        blog.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {blog.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(blog)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IoPencilOutline className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <IoTrashOutline className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#0a1128] text-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700/50 relative">
            
            {/* Header */}
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-slate-800 bg-[#0a1128]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <IoAddOutline className="w-5 h-5 text-emerald-400" />
                {editingId ? 'Edit Blog Post' : 'Add New Blog Post'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Top Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="text-slate-500">T</span> Blog Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Escape the City: 7 Hidden Hill Stations"
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>

                  {/* Category & Read Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span className="text-slate-500">✓</span> Category *
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Travel Guides"
                        className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span className="text-slate-500">⏱</span> Read Time
                      </label>
                      <input
                        type="text"
                        name="readTime"
                        value={formData.readTime}
                        onChange={handleInputChange}
                        placeholder="5 min read"
                        className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Blog Image */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="text-slate-500">🖼</span> Blog Image URL
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="Paste image URL here..."
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                    {formData.image && (
                      <div className="mt-3 h-32 rounded-xl overflow-hidden border border-slate-700/50">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="relative">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="text-slate-500">✓</span> Badge (Optional)
                    </label>
                    <select
                      name="badge"
                      value={formData.badge}
                      onChange={handleInputChange}
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="">None</option>
                      <option value="NEW">NEW</option>
                      <option value="TRENDING">TRENDING</option>
                      <option value="FEATURED">FEATURED</option>
                      <option value="HOT">HOT</option>
                      <option value="IMPORTANT">IMPORTANT</option>
                    </select>
                    {/* Add a custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-4 top-8 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  
                  {/* Status Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="isActive" 
                        checked={formData.isActive} 
                        onChange={handleInputChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    <span className="text-sm font-medium text-slate-300">Publish Article</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Excerpt */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="text-slate-500">≡</span> Excerpt / Short Description
                    </label>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      placeholder="Brief summary of the blog post (shows on listing page)..."
                      rows="3"
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                    ></textarea>
                  </div>

                  {/* Full Content */}
                  <div className="flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="text-slate-500">≡</span> Full Blog Content *
                    </label>
                    {/* NOTE: We use a textarea for now. User needs to run `npm install react-quill` and then we can swap this for the rich text editor. */}
                    <div className="w-full bg-[#111833] border border-slate-700/50 rounded-xl overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Write your article content here..."
                        rows="8"
                        className="w-full bg-transparent p-4 text-white placeholder-slate-500 focus:outline-none resize-y min-h-[200px]"
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="pt-6 border-t border-slate-800">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">SEO Metadata Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meta Title (SEO)</label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      placeholder="Better Title for Search Engines"
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEO Keywords (Comma Items)</label>
                    <input
                      type="text"
                      name="seoKeywords"
                      value={formData.seoKeywords}
                      onChange={handleInputChange}
                      placeholder="e.g. travel, hotels, booking guides"
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meta Description (SEO)</label>
                    <input
                      type="text"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      placeholder="Snippet displayed on Google search results..."
                      className="w-full bg-[#111833] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <IoAddOutline className="w-5 h-5" />
                  {submitting ? 'Saving...' : (editingId ? 'Update Blog' : 'Create Blog')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBlogs
