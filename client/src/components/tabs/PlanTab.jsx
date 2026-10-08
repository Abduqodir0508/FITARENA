import React, { useState, useEffect } from 'react';
import { splitTemplates } from '../../data/splitTemplates';

export default function PlanTab() {
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedExp, setSelectedExp] = useState('novice');
  const [planData, setPlanData] = useState(splitTemplates[3]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to fetch from backend API if available, fallback to client splitTemplates
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/plans/${selectedDays}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.plan) {
            setPlanData(data.plan);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Backend not running, use local data seamlessly
      }
      setPlanData(splitTemplates[selectedDays] || splitTemplates[3]);
      setLoading(false);
    };

    fetchPlan();
  }, [selectedDays]);

  const showSafetyWarning = selectedExp === 'novice' && (selectedDays === 6 || selectedDays === 7);

  return (
    <section className="space-y-5 animate-fadeIn">
      {/* Top Generator Banner */}
      <div className="bg-gradient-to-r from-cyan-950/50 via-slate-900 to-emerald-950/40 border border-cyan-500/30 p-5 rounded-3xl shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-2">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI INDIVIDUAL TASHXIS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Zal va Uy Uchun Aqlli Mashq Plani
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Novichoklar uchun adashib ketmaslik xaritasi. Haftada necha kun zalga chiqishingizni tanlang, AI sizga optimal yuklamani taqsimlab beradi.
          </p>
        </div>

        {/* Plan Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Days selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Haftada necha kun zalga chiqasiz?
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[2, 3, 4, 5, 6, 7].map((d) => {
                const isActive = selectedDays === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDays(d)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d} kun
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Tajriba darajangiz</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'novice', label: 'Novichok (0-6 oy)' },
                { id: 'medium', label: 'Tajribali (1-2 yil)' },
                { id: 'pro', label: 'Professional (2+ yil)' },
              ].map((exp) => {
                const isActive = selectedExp === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExp(exp.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {exp.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Safety Warning Notice */}
        {showSafetyWarning && (
          <div className="mt-4 bg-amber-500/15 border border-amber-500/40 p-3 rounded-xl flex items-center space-x-3 text-xs text-amber-200 animate-fadeIn">
            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-base shrink-0"></i>
            <span>
              <strong>AI Maslahati:</strong> Yangi boshlovchilar uchun haftada 6-7 kun mashq qilish jarohat va haddan tashqari charchoq (overtraining) olib kelishi mumkin. 3 yoki 4 kunlik splitdan boshlash tavsiya qilinadi!
            </span>
          </div>
        )}
      </div>

      {/* Generated Days Dynamic Cards Container */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-2"></div>
            <span>Reja tayyorlanmoqda...</span>
          </div>
        ) : (
          planData.map((dayItem, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-cyberBorder rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition shadow-lg"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm">
                    <i className={`fa-solid ${dayItem.icon || 'fa-dumbbell'}`}></i>
                  </div>
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      {dayItem.day}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      {dayItem.title}
                    </h3>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {dayItem.exercises.length} ta mashq
                </span>
              </div>

              {/* Exercises Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {dayItem.exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">{ex.name}</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{ex.sets}</div>
                    </div>
                    {ex.tip && (
                      <div className="text-[10px] text-slate-400 mt-2 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        💡 {ex.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
