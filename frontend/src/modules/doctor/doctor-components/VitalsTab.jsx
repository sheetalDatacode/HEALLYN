import React from 'react';
import { IoHeartOutline, IoThermometerOutline, IoPulseOutline, IoBodyOutline, IoWaterOutline, IoAddOutline } from 'react-icons/io5';

const VitalsTab = ({
  vitals,
  setVitals,
  setVitalsEdited,
  isConsultationActiveRef,
  onSaveVitals
}) => {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-4 shadow-md shadow-slate-200/50">
      <h3 className="mb-3 sm:mb-4 lg:mb-3 text-sm sm:text-base lg:text-base font-bold text-slate-900">Vitals & Examination</h3>
      <div className="grid gap-2.5 sm:gap-3 lg:gap-3 sm:grid-cols-2">
        {/* Blood Pressure */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoHeartOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-red-600 shrink-0" />
            Blood Pressure
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.bloodPressure?.systolic || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({
                  ...prev,
                  bloodPressure: { 
                    ...(prev.bloodPressure || {}), 
                    systolic: newValue 
                  },
                }));
              }}
              placeholder="Systolic"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-xs sm:text-sm lg:text-xs text-slate-500">/</span>
            <input
              type="number"
              value={vitals.bloodPressure?.diastolic || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({
                  ...prev,
                  bloodPressure: { 
                    ...(prev.bloodPressure || {}), 
                    diastolic: newValue 
                  },
                }));
              }}
              placeholder="Diastolic"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">mmHg</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoThermometerOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-orange-600 shrink-0" />
            Temperature
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.temperature || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({ ...prev, temperature: newValue }));
              }}
              placeholder="98.6"
              step="0.1"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">°F</span>
          </div>
        </div>

        {/* Pulse */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoPulseOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-red-600 shrink-0" />
            Pulse Rate
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.pulse || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({ ...prev, pulse: newValue }));
              }}
              placeholder="72"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">bpm</span>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-[#11496c] shrink-0" />
            Respiratory Rate
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.respiratoryRate || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({ ...prev, respiratoryRate: newValue }));
              }}
              placeholder="16"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">/min</span>
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoWaterOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-[#11496c] shrink-0" />
            SpO2
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.oxygenSaturation || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const newValue = e.target.value;
                setVitals((prev) => ({ ...prev, oxygenSaturation: newValue }));
              }}
              placeholder="98"
              max="100"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">%</span>
          </div>
        </div>

        {/* Weight */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
            Weight
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.weight || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const weightValue = e.target.value;
                setVitals((prev) => {
                  const updated = { ...prev, weight: weightValue };
                  if (updated.height && weightValue) {
                      const heightInMeters = parseFloat(updated.height) / 100;
                      const weightInKg = parseFloat(weightValue);
                    if (heightInMeters > 0 && weightInKg > 0 && !isNaN(heightInMeters) && !isNaN(weightInKg)) {
                        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                      updated.bmi = bmi;
                    } else {
                      updated.bmi = '';
                    }
                  } else {
                    updated.bmi = '';
                  }
                  return updated;
                });
              }}
              placeholder="70"
              min="0"
              step="0.1"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">kg</span>
          </div>
        </div>

        {/* Height */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
            Height
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              value={vitals.height || ''}
              onChange={(e) => {
                isConsultationActiveRef.current = true;
                setVitalsEdited(true);
                const heightValue = e.target.value;
                setVitals((prev) => {
                  const updated = { ...prev, height: heightValue };
                  if (updated.weight && heightValue) {
                      const heightInMeters = parseFloat(heightValue) / 100;
                      const weightInKg = parseFloat(updated.weight);
                    if (heightInMeters > 0 && weightInKg > 0 && !isNaN(heightInMeters) && !isNaN(weightInKg)) {
                        const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                      updated.bmi = bmi;
                    } else {
                      updated.bmi = '';
                    }
                  } else {
                    updated.bmi = '';
                  }
                  return updated;
                });
              }}
              placeholder="170"
              min="0"
              step="0.1"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
            />
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">cm</span>
          </div>
        </div>

        {/* BMI */}
        <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
          <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
            <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
            BMI
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="text"
              value={vitals.bmi || ''}
              readOnly
              placeholder="Auto calculated"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Add Vitals Button */}
      <div className="mt-4 sm:mt-5">
        <button
          type="button"
          onClick={onSaveVitals}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
        >
          <IoAddOutline className="h-5 w-5" />
          Add to Patient History
        </button>
      </div>
    </div>
  );
};

export default VitalsTab;
