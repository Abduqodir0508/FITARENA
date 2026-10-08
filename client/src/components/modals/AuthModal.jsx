import React, { useState } from 'react';
import { playSuccessFanfare, playBeep } from '../../utils/audioSynth';

export const UZBEKISTAN_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Buxoro",
  "Xorazm",
  "Qashqadaryo",
  "Surxondaryo",
  "Jizzax",
  "Sirdaryo",
  "Navoiy",
  "Qoraqalpog'iston Respublikasi"
];

export default function AuthModal({ isOpen, onClose, onRegister, initialUser, soundEnabled }) {
  const [firstName, setFirstName] = useState(initialUser?.firstName || '');
  const [lastName, setLastName] = useState(initialUser?.lastName || '');
  const [age, setAge] = useState(initialUser?.age || '20');
  const [region, setRegion] = useState(initialUser?.region || 'Toshkent shahri');
  const [gender, setGender] = useState(initialUser?.gender || 'male');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("Iltimos, ismingizni kiriting!");
      playBeep(300, 'sawtooth', 0.15, soundEnabled);
      return;
    }
    if (!lastName.trim()) {
      setError("Iltimos, familiyangizni kiriting!");
      playBeep(300, 'sawtooth', 0.15, soundEnabled);
      return;
    }
    const numAge = parseInt(age, 10);
    if (!numAge || numAge < 7 || numAge > 90) {
      setError("Iltimos, haqiqiy yoshingizni kiriting (7 - 90 yosh)!");
      playBeep(300, 'sawtooth', 0.15, soundEnabled);
      return;
    }

    const userData = {
      id: initialUser?.id || `user_${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      age: numAge,
      region,
      gender,
      registeredAt: initialUser?.registeredAt || new Date().toISOString(),
      xp: initialUser?.xp || 1450,
      totalReps: initialUser?.totalReps || 0,
      duelsWon: initialUser?.duelsWon || 0,
      duelsTotal: initialUser?.duelsTotal || 0,
      badge: initialUser?.badge || "Olmos",
    };

    playSuccessFanfare(soundEnabled);
    onRegister(userData);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 text-2xl font-black mb-3 shadow-lg shadow-emerald-500/20">
            <i className="fa-solid fa-id-card"></i>
          </div>
          <h2 className="text-xl font-black text-white">
            {initialUser ? "Profilni Tahrirlash" : "FitArena'da Ro'yxatdan O'tish"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Milliy reyting va 1v1 duellarda qatnashish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-xl flex items-center space-x-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Ism va Familiya */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">Ism</label>
              <input
                type="text"
                required
                placeholder="Jasur"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">Familiya</label>
              <input
                type="text"
                required
                placeholder="Karimov"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError(''); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Yosh va Jins */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">Yosh</label>
              <input
                type="number"
                min="7"
                max="90"
                required
                placeholder="20"
                value={age}
                onChange={(e) => { setAge(e.target.value); setError(''); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">Jins</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="male">Erkak 👦</option>
                <option value="female">Ayol 👧</option>
              </select>
            </div>
          </div>

          {/* Viloyat */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">Viloyat / Hudud</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            >
              {UZBEKISTAN_REGIONS.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
            <span>{initialUser ? "Saqlash" : "Platformaga Kirish & Reytingni Boshlash"}</span>
          </button>
        </form>

        {onClose && initialUser && (
          <button
            onClick={onClose}
            className="w-full mt-2 text-xs text-slate-400 hover:text-slate-200 py-1.5 transition"
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
}
