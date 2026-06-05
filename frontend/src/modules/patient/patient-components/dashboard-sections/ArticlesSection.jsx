import React, { useState, useEffect } from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { getBlogs } from '../../patient-services/patientService'

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400'
]

const ArticlesSection = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const res = await getBlogs({ limit: 4 })
        if (res.success && res.data && res.data.items) {
          setArticles(res.data.items)
        } else {
          setArticles([])
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err)
        setArticles([])
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl md:text-xl font-bold text-slate-800">Articles for you</h2>
         <button className="text-[#11496c] font-bold text-sm hover:underline">View All</button>
      </div>
      
      {loading ? (
        <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[200px] md:min-w-0 bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 animate-pulse">
               <div className="h-32 md:h-44 bg-slate-200"></div>
               <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
               </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center text-slate-500 py-12 bg-white rounded-[24px] border border-slate-200 border-dashed">
          No articles available at the moment.
        </div>
      ) : (
        <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4">
          {articles.map((article, index) => (
            <div 
              key={article._id} 
              onClick={() => navigate(`/patient/articles/${article._id}`)}
              className="min-w-[200px] md:min-w-0 snap-center bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group cursor-pointer relative"
            >
               {article.badge && (
                 <span className="absolute top-3 right-3 z-10 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">
                   {article.badge}
                 </span>
               )}
               <div className="h-32 md:h-44 overflow-hidden bg-slate-100">
                  <img src={article.image || DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]} alt={article.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div className="p-4 md:p-5 space-y-2">
                  <h3 className="text-base md:text-base font-bold text-slate-900 leading-tight line-clamp-1" title={article.title}>{article.title}</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center justify-between pt-1">
                     <p className="text-[9px] md:text-[10px] text-[#11496c] font-black uppercase tracking-widest">{article.readTime || '5 MIN READ'}</p>
                     <button className="text-slate-900 text-[10px] md:text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <IoArrowForwardOutline className="h-3 w-3" />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ArticlesSection
