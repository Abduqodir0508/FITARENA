import React from 'react';

export default function TabsNav({ activeTab, onSelectTab }) {
  const tabs = [
    {
      id: 'camera-tab',
      label: 'AI Mashq (Kamera)',
      icon: 'fa-camera',
      iconColor: '',
    },
    {
      id: 'duel-tab',
      label: '1v1 Jonli Duel',
      icon: 'fa-hand-fist',
      iconColor: 'text-red-400',
      ping: true,
    },
    {
      id: 'plan-tab',
      label: 'AI Zal Plani (2-7 Kun)',
      icon: 'fa-dumbbell',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'ranking-tab',
      label: "O'zbekiston Reytingi",
      icon: 'fa-trophy',
      iconColor: 'text-amber-400',
    },
    {
      id: 'guide-tab',
      label: "Qo'llanma",
      icon: 'fa-circle-question',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <nav className="bg-[#0b101c] border-b border-cyberBorder overflow-x-auto no-scrollbar py-2 px-4 sticky top-[61px] z-40">
      <div className="max-w-6xl mx-auto flex items-center space-x-2 md:space-x-3 text-xs md:text-sm font-medium">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <i className={`fa-solid ${tab.icon} ${!isActive && tab.iconColor ? tab.iconColor : ''}`}></i>
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.ping && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
