import React from 'react';
import { playBeep } from '../utils/audioSynth';

export default function Navbar({ userXP, soundEnabled, onToggleSound, onLogoClick }) {
  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    onToggleSound(nextState);
    if (nextState) {
      playBeep(880, 'sine', 0.08, true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0c121e]/90 backdrop-blur-md border-b border-cyberBorder px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={onLogoClick}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transform transition hover:scale-105 active:scale-95">
            <i className="fa-solid fa-bolt text-slate-950 font-black text-xl"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                FITARENA
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                AI UZ
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Jonli Raqamli Trener & Duellar</p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Live Anti-cheat badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 rounded-full text-xs text-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live"></span>
            <span className="font-medium">Faqat Jonli Kamera (Cheat Blocked)</span>
          </div>

          {/* User Level & XP Badge */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold mr-2">
              <i className="fa-solid fa-crown text-xs"></i>
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Daraja 4</div>
              <div className="text-xs font-bold text-amber-300">{userXP.toLocaleString()} XP</div>
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
