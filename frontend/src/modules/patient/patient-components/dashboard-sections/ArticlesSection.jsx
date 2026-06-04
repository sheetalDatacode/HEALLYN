import React from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'

const ArticlesSection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
       <h2 className="text-xl md:text-xl font-bold text-slate-800">Articles for you</h2>
       <button className="text-[#11496c] font-bold text-sm hover:underline">View All</button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4">
      {[
        { id: 1, title: 'Immunity Boosting Tips', desc: 'Practical ways to strengthen your immune system naturally.', time: '23 min(s) read', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' },
        { id: 2, title: 'Women\'s Health Guide', desc: 'Essential health checks and wellness advice for women.', time: '20 min(s) read', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400' },
        { id: 3, title: 'Nutrition 101', desc: 'Understanding the basics of a balanced diet for long-term health.', time: '15 min(s) read', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400' },
        { id: 4, title: 'Yoga for Stress', desc: 'Manage daily stress through simple breathing and yoga techniques.', time: '12 min(s) read', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400' },
      ].map(article => (
        <div key={article.id} className="min-w-[200px] md:min-w-0 snap-center bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group cursor-pointer">
           <div className="h-32 md:h-44 overflow-hidden">
              <img src={article.img} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
           </div>
           <div className="p-4 md:p-5 space-y-2">
              <h3 className="text-base md:text-base font-bold text-slate-900 leading-tight line-clamp-1">{article.title}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-2">{article.desc}</p>
              <div className="flex items-center justify-between pt-1">
                 <p className="text-[9px] md:text-[10px] text-[#11496c] font-black uppercase tracking-widest">{article.time}</p>
                 <button className="text-slate-900 text-[10px] md:text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <IoArrowForwardOutline className="h-3 w-3" />
                 </button>
              </div>
           </div>
        </div>
      ))}
    </div>
  </div>
)

export default ArticlesSection
