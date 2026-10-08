import React, { useState, useEffect, useMemo } from 'react';
import { UZBEKISTAN_REGIONS } from '../modals/AuthModal';

const baseAthletes = [
  { id: 'ath_1', name: "Jasur_Fit", region: "Toshkent shahri", duels: "24 / 28", reps: 1120, badge: "Olmos" },
  { id: 'ath_2', name: "Bekzod_99", region: "Samarqand", duels: "19 / 22", reps: 840, badge: "Olmos" },
  { id: 'ath_3', name: "Umid_Vorkaut", region: "Farg'ona", duels: "17 / 20", reps: 760, badge: "Oltin" },
  { id: 'ath_4', name: "Sherzod_Tashkent", region: "Toshkent shahri", duels: "14 / 18", reps: 690, badge: "Oltin" },
  { id: 'ath_5', name: "Anvar_Buxoro", region: "Buxoro", duels: "12 / 15", reps: 620, badge: "Kumush" },
  { id: 'ath_6', name: "Doston_Andijon", region: "Andijon", duels: "11 / 14", reps: 580, badge: "Kumush" },
  { id: 'ath_7', name: "Xurshid_Xorazm", region: "Xorazm", duels: "9 / 12", reps: 510, badge: "Bronza" },
  { id: 'ath_8', name: "Sardor_Qashqadaryo", region: "Qashqadaryo", duels: "8 / 11", reps: 490, badge: "Bronza" }
];

export default function RankingTab({ currentUser }) {
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Dynamically compute full leaderboard combining static top athletes + currentUser with real reps!
  const computedLeaderboard = useMemo(() => {
    let list = [...baseAthletes];

    if (currentUser) {
      const userReps = (currentUser.totalReps || 0) + Math.floor((currentUser.xp || 1450) / 2.5);
      const userDuels = `${currentUser.duelsWon || 0} / ${currentUser.duelsTotal || 0}`;

      const userEntry = {
        id: currentUser.id || 'current_user',
        name: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        region: currentUser.region || 'Toshkent shahri',
        duels: userDuels,
        reps: userReps,
        badge: userReps > 1000 ? "Olmos" : userReps > 600 ? "Oltin" : "Kumush",
        isUser: true,
        age: currentUser.age,
      };

      list.push(userEntry);
    }

    // Sort descending by total reps
    list.sort((a, b) => b.reps - a.reps);

    // Assign dynamic ranks
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [currentUser]);

  // Filter by selected region
  const filteredList = useMemo(() => {
    if (selectedRegion === 'all') return computedLeaderboard;
    return computedLeaderboard.filter((p) =>
      p.region.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      selectedRegion.toLowerCase().includes(p.region.toLowerCase())
    );
  }, [computedLeaderboard, selectedRegion]);

  const top3 = computedLeaderboard.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <section className="space-y-5 animate-fadeIn">
      {/* Leaderboard Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-cyberBorder p-4 sm:p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <i className="fa-solid fa-trophy text-amber-400"></i>
            <span>O'zbekiston Milliy Reytingi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ro'yxatdan o'tgan barcha atletlarning AI orqali tasdiqlangan jonli natijalari
          </p>
        </div>

        {/* Region selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold shrink-0">Viloyat:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">Butun O'zbekiston</option>
            {UZBEKISTAN_REGIONS.map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 2nd place */}
        {second && (
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-center order-2 sm:order-1 relative shadow-lg">
            <div className="w-7 h-7 rounded-full bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center mx-auto mb-2">
              2
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 mx-auto flex items-center justify-center text-slate-300 text-xl font-bold mb-2">
              <i className="fa-solid fa-user-ninja"></i>
            </div>
            <h4 className="text-sm font-bold text-white flex items-center justify-center space-x-1">
              <span>{second.name}</span>
              {second.isUser && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">SIZ</span>}
            </h4>
            <span className="text-[11px] text-slate-400">{second.region}</span>
            <div className="mt-2 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
              {second.reps.toLocaleString()} Takrorlash
            </div>
          </div>
        )}

        {/* 1st place Champion */}
        {first && (
          <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500 rounded-2xl p-5 text-center order-1 sm:order-2 relative shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full flex items-center space-x-1 shadow">
              <i className="fa-solid fa-crown text-[10px]"></i>
              <span>Lider</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mt-1 mb-2 shadow">
              1
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 text-2xl font-bold mb-2">
              <i className="fa-solid fa-medal"></i>
            </div>
            <h4 className="text-base font-extrabold text-white flex items-center justify-center space-x-1.5">
              <span>{first.name}</span>
              {first.isUser && <span className="text-[10px] bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-black">SIZ</span>}
            </h4>
            <span className="text-xs text-amber-400 font-semibold">{first.region}</span>
            <div className="mt-3 text-sm font-black text-amber-300 bg-amber-500/20 py-1.5 rounded-xl border border-amber-500/30">
              {first.reps.toLocaleString()} Takrorlash
            </div>
          </div>
        )}

        {/* 3rd place */}
        {third && (
          <div className="bg-slate-900/80 border border-amber-800/60 rounded-2xl p-4 text-center order-3 sm:order-3 relative shadow-lg">
            <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mx-auto mb-2">
              3
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-700 mx-auto flex items-center justify-center text-amber-600 text-xl font-bold mb-2">
              <i className="fa-solid fa-dumbbell"></i>
            </div>
            <h4 className="text-sm font-bold text-white flex items-center justify-center space-x-1">
              <span>{third.name}</span>
              {third.isUser && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">SIZ</span>}
            </h4>
            <span className="text-[11px] text-slate-400">{third.region}</span>
            <div className="mt-2 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
              {third.reps.toLocaleString()} Takrorlash
            </div>
          </div>
        )}
      </div>

      {/* Ranking Table */}
      <div className="bg-slate-900 border border-cyberBorder rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-3 sm:p-4 text-center w-12">O'rin</th>
                <th className="p-3 sm:p-4">Foydalanuvchi</th>
                <th className="p-3 sm:p-4">Viloyat</th>
                <th className="p-3 sm:p-4 text-center">Duellar</th>
                <th className="p-3 sm:p-4 text-right">Jami Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    Bu viloyat bo'yicha hozircha ma'lumot yo'q
                  </td>
                </tr>
              ) : (
                filteredList.map((player) => {
                  let badgeColor = 'bg-slate-800 text-slate-300';
                  if (player.badge === 'Olmos') {
                    badgeColor = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
                  } else if (player.badge === 'Oltin') {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
                  }

                  const isMe = player.isUser;

                  return (
                    <tr
                      key={player.id || player.rank}
                      className={`transition ${
                        isMe
                          ? 'bg-emerald-950/40 border-l-4 border-l-emerald-400 font-bold'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-center font-bold font-mono">
                        <span className={isMe ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                          #{player.rank}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className={isMe ? 'text-emerald-300 font-black text-sm' : 'font-bold text-white'}>
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-wider">
                              SIZ
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badgeColor}`}>
                            {player.badge}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-slate-300">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-location-dot text-[10px] text-slate-500"></i>
                          <span>{player.region}</span>
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center text-emerald-400 font-mono">
                        {player.duels}
                      </td>
                      <td className={`p-3 sm:p-4 text-right font-black font-mono ${isMe ? 'text-emerald-400 text-base' : 'text-white'}`}>
                        {player.reps.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
