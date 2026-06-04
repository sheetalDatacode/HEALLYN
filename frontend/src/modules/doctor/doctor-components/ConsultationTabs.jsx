import React from 'react';

const ConsultationTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch] pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
      <button
        type="button"
        onClick={() => setActiveTab('vitals')}
        className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
          activeTab === 'vitals'
            ? 'text-white shadow-md scale-105'
            : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
        }`}
        style={activeTab === 'vitals' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
      >
        Vitals & Exam
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('prescription')}
        className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
          activeTab === 'prescription'
            ? 'text-white shadow-md scale-105'
            : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
        }`}
        style={activeTab === 'prescription' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
      >
        Prescription
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('history')}
        className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
          activeTab === 'history'
            ? 'text-white shadow-md scale-105'
            : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
        }`}
        style={activeTab === 'history' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
      >
        History
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('saved')}
        className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
          activeTab === 'saved'
            ? 'text-white shadow-md scale-105'
            : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
        }`}
        style={activeTab === 'saved' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
      >
        Saved
      </button>
    </div>
  );
};

export default ConsultationTabs;
