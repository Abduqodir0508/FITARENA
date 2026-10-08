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

  const level = Math.floor(userXP / 400) + 1;

  return (
    <header className="sticky top-0 z-50 bg-[#0c121e]/90 backdrop-blur-md border-b border-cyberBorder px-3 sm:px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none" onClick={onLogoClick}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transform transition hover:scale-105 active:scale-95">
            <i className="fa-solid fa-bolt text-slate-950 font-black text-lg sm:text-xl"></i>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                FITARENA
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                AI UZ
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:block">Jonli Raqamli Trener & Duellar</p>
          </div>
        </div>

        {/* User Profile & Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live Anti-cheat badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 rounded-full text-xs text-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live"></span>
            <span className="font-medium">Faqat Jonli Kamera</span>
          </div>

          {/* User Profile Tag Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 transition text-left active:scale-95"
              title="Profilni ko'rish va tahrirlash"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 text-xs font-bold mr-2">
                <i className={currentUser.gender === 'female' ? "fa-solid fa-user-nurse" : "fa-solid fa-user-ninja"}></i>
              </div>
              <div className="text-left">
                <div className="text-[11px] font-extrabold text-white truncate max-w-[90px] sm:max-w-[130px]">
                  {currentUser.firstName} {currentUser.lastName?.[0]}.
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <span>{currentUser.age} yosh</span>
                  <span>•</span>
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">{currentUser.region}</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Ro'yxatdan O'tish</span>
            </button>
          )}

          {/* User Level & XP Badge */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold mr-1.5 sm:mr-2">
              <i className="fa-solid fa-crown text-[10px]"></i>
            </div>
            <div className="text-left">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Daraja {level}</div>
              <div className="text-[11px] sm:text-xs font-bold text-amber-300">{userXP.toLocaleString()} XP</div>
            </div>
          </div>

          {/* Audio toggle button */}
          <button
            onClick={handleSoundToggle}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-emerald-400 transition"
            title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {soundEnabled ? (
              <i className="fa-solid fa-volume-high text-emerald-400"></i>
            ) : (
              <i className="fa-solid fa-volume-xmark text-slate-500"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
