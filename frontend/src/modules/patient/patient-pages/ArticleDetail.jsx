import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IoArrowBackOutline, IoTimeOutline, IoCalendarOutline } from 'react-icons/io5'
import { getBlogById } from '../patient-services/patientService'

const ArticleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true)
        const res = await getBlogById(id)
        if (res.success && res.data) {
          setArticle(res.data)
          // Update page title
          document.title = res.data.metaTitle || res.data.title || 'Heallyn Article'
        }
      } catch (err) {
        console.error('Failed to fetch article:', err)
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      fetchArticle()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex justify-center pt-20">
        <div className="w-full max-w-4xl space-y-6 animate-pulse">
          <div className="h-8 w-24 bg-slate-200 rounded"></div>
          <div className="h-64 md:h-96 w-full bg-slate-200 rounded-2xl"></div>
          <div className="h-10 w-3/4 bg-slate-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Article not found</h2>
        <p className="text-slate-500">The article you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-[#11496c] text-white rounded-xl font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-[#11496c] font-medium transition-colors"
          >
            <IoArrowBackOutline className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Article Header */}
        <div className="space-y-6 mb-8 md:mb-12 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="text-[#11496c] bg-[#11496c]/10 px-3 py-1 rounded-full">{article.category}</span>
            <span className="flex items-center gap-1"><IoTimeOutline className="w-4 h-4" /> {article.readTime || '5 MIN READ'}</span>
            <span className="flex items-center gap-1"><IoCalendarOutline className="w-4 h-4" /> {new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            {article.title}
          </h1>
          
          {article.excerpt && (
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl">
              {article.excerpt}
            </p>
          )}
        </div>

        {/* Hero Image */}
        {(article.image || true) && (
          <div className="w-full h-64 md:h-[500px] rounded-[32px] overflow-hidden shadow-lg mb-12">
            <img 
              src={article.image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200'} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="bg-white rounded-[32px] p-6 md:p-12 shadow-sm border border-slate-100">
          <div 
            className="prose prose-slate md:prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-[#11496c] prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </div>
  )
}

export default ArticleDetail
