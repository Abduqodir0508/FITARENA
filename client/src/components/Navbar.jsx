import React from 'react';
import { playBeep } from '../utils/audioSynth';

export default function Navbar({ currentUser, userXP, soundEnabled, onToggleSound, onLogoClick, onOpenProfile }) {
  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    onToggleSound(nextState);
    if (nextState) {
      playBeep(880, 'sine', 0.08, true);
    }
  };

  // Har 100 EXP da yangi daraja ochiladi. 0 EXP = Daraja 0.
  const safeXP = Number(userXP) || 0;
  const level = Math.floor(safeXP / 100);

  return (
    <header className="sticky top-0 z-50 bg-[#0c121e]/95 backdrop-blur-md border-b border-cyberBorder px-2.5 sm:px-4 py-2 sm:py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-1.5 sm:space-x-2.5 cursor-pointer select-none shrink-0"
          onClick={onLogoClick}
          title="Bosh sahifa"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md sm:shadow-lg shadow-emerald-500/20 transform transition hover:scale-105 active:scale-95">
            <i className="fa-solid fa-bolt text-slate-950 font-black text-sm sm:text-lg"></i>
          </div>
          <div>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="font-extrabold text-sm sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                FITARENA
              </span>
              <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 hidden md:block">Jonli AI Trener & Duellar</p>
          </div>
        </div>

        {/* User Profile & Badges Bar (Mobil uchun qulay flex konteyner) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* Live Anti-cheat badge (Desktop only) */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs text-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live"></span>
            <span className="font-medium text-[11px]">Jonli Kamera</span>
          </div>

          {/* User Profile Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 transition text-left active:scale-95 max-w-[125px] xs:max-w-[150px] sm:max-w-none"
              title="Profilni ko'rish va tahrirlash"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 text-[10px] sm:text-xs font-bold mr-1.5 shrink-0">
                <i className={currentUser.gender === 'female' ? "fa-solid fa-user-nurse" : "fa-solid fa-user-ninja"}></i>
              </div>
              <div className="truncate text-left">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-white truncate">
                  {currentUser.firstName} {currentUser.lastName?.[0] ? `${currentUser.lastName[0]}.` : ''}
                </div>
                <div className="text-[9px] text-emerald-400 truncate hidden xs:block">
                  {currentUser.region}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs flex items-center space-x-1 shadow transition active:scale-95"
            >
              <i className="fa-solid fa-user-plus text-[10px]"></i>
              <span className="whitespace-nowrap">Kirish</span>
            </button>
          )}

          {/* User Level & XP Chip (Boshlang'ich Daraja 0, 0 EXP) */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-[10px] sm:text-xs font-bold mr-1 sm:mr-1.5 shrink-0">
              <i className="fa-solid fa-crown text-[9px] sm:text-[10px]"></i>
            </div>
            <div className="text-left">
              <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold leading-tight">
                Daraja {level}
              </div>
              <div className="text-[10px] sm:text-xs font-extrabold text-amber-300 leading-tight">
                {safeXP.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Audio toggle button */}
          <button
            onClick={handleSoundToggle}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-emerald-400 transition shrink-0 active:scale-95"
            title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {soundEnabled ? (
              <i className="fa-solid fa-volume-high text-emerald-400 text-xs sm:text-sm"></i>
            ) : (
              <i className="fa-solid fa-volume-xmark text-slate-500 text-xs sm:text-sm"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
