import React from 'react';

export default function GuideTab() {
  const steps = [
    {
      num: 1,
      color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      title: "Kamerani Qulay Joylashtirish",
      desc: "Telefonni polga yoki stulga vertikal holatda qo'ying. Siz kameradan 1.5 – 2 metr masofaga uzoqlashing. Boshdan to oyoqqacha to'liq kadrga sig'ishi kerak.",
    },
    {
      num: 2,
      color: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      title: "Nega Galereyadan Video Yuklab Bo'lmaydi?",
      desc: "Barcha musobaqalar mutlaqo halol bo'lishi uchun oldindan olingan videolarni yuklash cheklangan. AI faqat real vaqtda (WebRTC live) olinayotgan videolarni hisoblaydi.",
    },
    {
      num: 3,
      color: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      title: "AI Mashqni Qanday Taniydi?",
      desc: "AI sizning tirsak, yelka va tizza bo'g'inlaringizdagi burchaklarni real vaqtda o'lchaydi. Tirsak burchagi 90° dan pastga tushib, yana 160° ga yozilgandagina 1 ta takror deb hisoblaydi va audio signal beradi.",
    },
    {
      num: 4,
      color: 'bg-red-500/20 border-red-500/40 text-red-400',
      title: "1v1 Jonli Duellar Qoidalari",
      desc: "60 soniya ichida kim ko'proq to'g'ri takrorlash bajarsa g'alaba qozonadi. Har bir g'alaba sizga +150 XP beradi va siz Oltin hamda Olmos ligaga ko'tarilasiz.",
    },
  ];

  return (
    <section className="space-y-4 animate-fadeIn">
      <div className="bg-slate-900 border border-cyberBorder p-5 rounded-3xl shadow-xl">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold mb-2">
          <i className="fa-solid fa-graduation-cap"></i>
          <span>BOSHLANG'ICH YO'RIQNOMA</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">FitArena Qanday Ishlaydi?</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sayt sun'iy intellekt orqali sizning harakatlaringizni tekshiradi, hisoblaydi va do'stlaringiz bilan adolatli bellashish imkonini beradi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <div key={step.num} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-slate-700 transition">
            <div className={`w-10 h-10 rounded-xl border ${step.color} font-black flex items-center justify-center mb-3 text-lg`}>
              {step.num}
            </div>
            <h3 className="font-bold text-base text-white">{step.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
