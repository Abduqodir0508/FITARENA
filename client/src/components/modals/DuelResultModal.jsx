import React from 'react';

export default function DuelResultModal({ isOpen, isWinner, userScore, opponentScore, opponentName, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-slate-900 border-2 ${isWinner ? 'border-emerald-500' : 'border-red-500'} rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative animate-fadeIn`}>
        {/* Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-full ${
            isWinner
              ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 animate-bounce'
              : 'bg-red-500/20 border-2 border-red-400 text-red-400'
          } flex items-center justify-center text-4xl mb-4`}
        >
          {isWinner ? (
            <i className="fa-solid fa-trophy"></i>
          ) : (
            <i className="fa-solid fa-shield-cat"></i>
          )}
        </div>

        {/* Title & Desc */}
        <h2 className="text-2xl font-black text-white">
          {isWinner ? "G'ALABA! 🎉" : "MAG'LUBIYAT 🥋"}
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-4">
          {isWinner
            ? `${opponentName || 'Raqib'} ustidan g'alaba qozondingiz! AI takrorlashlarni to'liq tasdiqladi.`
            : `Bu safar ${opponentName || 'Raqib'} tezroq chiqdi. Mashq qilishda davom eting!`}
        </p>

        {/* Score comparison */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-4 flex justify-around">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Sizning ballingiz</div>
            <div className="text-2xl font-black text-emerald-400">{userScore}</div>
          </div>
          <div className="border-r border-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Raqib bali</div>
            <div className="text-2xl font-black text-red-400">{opponentScore}</div>
          </div>
        </div>

        {/* Reward pill */}
        <div className={`p-3 mb-5 text-xs font-bold rounded-xl border ${
          isWinner
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}>
          {isWinner
            ? '+150 XP va 1 g\'alaba seriyasi qo\'shildi! 🚀'
            : '+25 XP faollik uchun berildi! 💪'}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20 active:scale-98"
        >
          Tushunarli, Davom Etish
        </button>
      </div>
    </div>
  );
}
