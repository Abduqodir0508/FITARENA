import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UZBEKISTAN_REGIONS } from '../modals/AuthModal';

export default function RankingTab({ currentUser, userXP }) {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [dbRankings, setDbRankings] = useState([]);
  const [totalUsersInDb, setTotalUsersInDb] = useState(0);
  const [userRankInfo, setUserRankInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch real rankings from Backend DB
  const loadRankings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const currentId = currentUser?.id || '';
      const res = await fetch(`/api/rankings?region=${encodeURIComponent(selectedRegion)}&userId=${encodeURIComponent(currentId)}`);
      if (!res.ok) throw new Error("Serverdan javob olinmadi");
      const data = await res.json();

      if (data.success) {
        setDbRankings(data.rankings || []);
        setTotalUsersInDb(data.totalUsersInDb || (data.rankings ? data.rankings.length : 0));
        setUserRankInfo(data.currentUserRankInfo || null);
      } else {
        throw new Error(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.warn("Reyting API xabari (offline/lokal zaxira):", err.message);
      setFetchError("Serverga ulanib bo'lmadi. Lokal ma'lumotlar ko'rsatilmoqda.");

      // Offline / LocalStorage fallback: Faqat haqiqiy foydalanuvchi profilidan foydalanish (Hech qanday mock bot yo'q!)
      if (currentUser) {
        const localUser = {
          id: currentUser.id,
          name: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          region: currentUser.region || 'Toshkent shahri',
          exp: Number(userXP ?? currentUser.xp ?? 0),
          level: Math.floor(Number(userXP ?? currentUser.xp ?? 0) / 100),
          totalReps: currentUser.totalReps || 0,
          duelsWon: currentUser.duelsWon || 0,
          duelsTotal: currentUser.duelsTotal || 0,
          badge: currentUser.badge || "Boshlang'ich",
          rank: 1,
        };
        // Faqat tanlangan viloyatga mos kelsa
        if (selectedRegion === 'all' || localUser.region.toLowerCase().includes(selectedRegion.toLowerCase())) {
          setDbRankings([localUser]);
          setTotalUsersInDb(1);
          setUserRankInfo({ rank: 1, isInTop20: true, expNeededForTop20: 0, totalPlayers: 1 });
        } else {
          setDbRankings([]);
          setTotalUsersInDb(0);
          setUserRankInfo(null);
        }
      } else {
        setDbRankings([]);
        setTotalUsersInDb(0);
        setUserRankInfo(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion, currentUser, userXP]);

  // Load rankings on region change or when user updates
  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  // Top 20 list (qat'iy birinchi 20 nafar eng ko'p EXP to'plagan o'yinchi)
  const top20List = useMemo(() => {
    return (dbRankings || []).slice(0, 20);
  }, [dbRankings]);

  // Check if current user is within Top 20
  const isCurrentUserInTop20 = useMemo(() => {
    if (!currentUser) return false;
    return top20List.some((p) => p.id === currentUser.id);
  }, [top20List, currentUser]);

  const top3 = top20List.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <section className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Leaderboard Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-cyberBorder p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-white">
              O'zbekiston Milliy Reytingi (Top-20)
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Faqat haqiqiy ro'yxatdan o'tgan foydalanuvchilarning umumiy EXP ko'rsatkichi bo'yicha tartiblangan
          </p>
        </div>

        {/* Region selector & Refresh button */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] sm:text-xs text-slate-400 font-semibold shrink-0">Viloyat:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs focus:outline-none focus:border-amber-400 flex-1 sm:flex-initial"
          >
            <option value="all">Barcha Viloyatlar</option>
            {UZBEKISTAN_REGIONS.map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
          <button
            onClick={loadRankings}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 transition flex items-center justify-center shrink-0 active:scale-95"
            title="Yangilash"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${isLoading ? 'animate-spin text-amber-400' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Top 3 Podium (Only displayed if real athletes exist in DB) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* 2nd place */}
          {second && (
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center order-2 sm:order-1 relative shadow-lg">
              <div className="w-6 h-6 rounded-full bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                2
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-400 mx-auto flex items-center justify-center text-slate-300 text-lg font-bold mb-1.5">
                <i className="fa-solid fa-user-ninja"></i>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-center space-x-1 truncate">
                <span className="truncate">{second.fullName || second.name}</span>
                {currentUser && second.id === currentUser.id && (
                  <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-black shrink-0">SIZ</span>
                )}
              </h4>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">{second.region}</span>
              <div className="mt-1.5 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
                {(second.exp || 0).toLocaleString()} EXP
              </div>
            </div>
          )}

          {/* 1st place Champion */}
          {first && (
            <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 text-center order-1 sm:order-2 relative shadow-lg shadow-amber-500/10">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow">
                <i className="fa-solid fa-crown text-[9px]"></i>
                <span>Lider</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center mx-auto mt-0.5 mb-1.5 shadow">
                1
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 text-xl font-bold mb-1.5">
                <i className="fa-solid fa-medal"></i>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center justify-center space-x-1.5 truncate">
                <span className="truncate">{first.fullName || first.name}</span>
                {currentUser && first.id === currentUser.id && (
                  <span className="text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-black shrink-0">SIZ</span>
                )}
              </h4>
              <span className="text-[11px] sm:text-xs text-amber-400 font-semibold truncate block">{first.region}</span>
              <div className="mt-2 text-xs sm:text-sm font-black text-amber-300 bg-amber-500/20 py-1 rounded-xl border border-amber-500/30">
                {(first.exp || 0).toLocaleString()} EXP
              </div>
            </div>
          )}

          {/* 3rd place */}
          {third && (
            <div className="bg-slate-900/80 border border-amber-800/60 rounded-2xl p-3 sm:p-4 text-center order-3 sm:order-3 relative shadow-lg">
              <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                3
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-amber-700 mx-auto flex items-center justify-center text-amber-600 text-lg font-bold mb-1.5">
                <i className="fa-solid fa-dumbbell"></i>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-center space-x-1 truncate">
                <span className="truncate">{third.fullName || third.name}</span>
                {currentUser && third.id === currentUser.id && (
                  <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-black shrink-0">SIZ</span>
                )}
              </h4>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">{third.region}</span>
              <div className="mt-1.5 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
                {(third.exp || 0).toLocaleString()} EXP
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top-20 Leaderboard Table */}
      <div className="bg-slate-900 border border-cyberBorder rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[9px] sm:text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-2.5 sm:p-4 text-center w-10 sm:w-14">O'rin</th>
                <th className="p-2.5 sm:p-4">Foydalanuvchi</th>
                <th className="p-2.5 sm:p-4">Viloyat</th>
                <th className="p-2.5 sm:p-4 text-center">Daraja</th>
                <th className="p-2.5 sm:p-4 text-right">Umumiy EXP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {top20List.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 sm:p-8 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-amber-400 text-xl mb-2">
                      <i className="fa-solid fa-users-slash"></i>
                    </div>
                    <div className="text-sm font-bold text-slate-300">
                      {selectedRegion === 'all'
                        ? "Hozircha bazada haqiqiy atletlar mavjud emas"
                        : `${selectedRegion} bo'yicha hozircha natija yo'q`}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Mashqlarni bajaring yoki 1v1 duellarda qatnashib EXP to'plang va milliy reytingning Top-20 taligida birinchi bo'lib o'rin oling!
                    </p>
                  </td>
                </tr>
              ) : (
                top20List.map((player) => {
                  const isMe = currentUser && (player.id === currentUser.id || player.name === currentUser.fullName);
                  const playerExp = Number(player.exp || 0);
                  const playerLevel = Math.floor(playerExp / 100);

                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (player.badge === 'Olmos' || playerExp >= 2000) {
                    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                  } else if (player.badge === 'Oltin' || playerExp >= 1000) {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  } else if (player.badge === 'Kumush' || playerExp >= 500) {
                    badgeColor = 'bg-slate-400/20 text-slate-300 border-slate-400/40';
                  }

                  return (
                    <tr
                      key={player.id || `rank_${player.rank}`}
                      className={`transition ${
                        isMe
                          ? 'bg-emerald-950/40 border-l-4 border-l-emerald-400 font-bold'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* O'rin */}
                      <td className="p-2.5 sm:p-4 text-center font-bold font-mono">
                        <span className={isMe ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                          #{player.rank}
                        </span>
                      </td>

                      {/* Foydalanuvchi */}
                      <td className="p-2.5 sm:p-4">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <span className={`truncate max-w-[110px] sm:max-w-[160px] ${isMe ? 'text-emerald-300 font-black' : 'font-bold text-white'}`}>
                            {player.fullName || player.name}
                          </span>
                          {isMe && (
                            <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-black tracking-wider shrink-0">
                              SIZ
                            </span>
                          )}
                          <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-bold border hidden xs:inline-block ${badgeColor}`}>
                            {player.badge || "Atlet"}
                          </span>
                        </div>
                      </td>

                      {/* Viloyat */}
                      <td className="p-2.5 sm:p-4 text-slate-300">
                        <span className="flex items-center space-x-1 truncate max-w-[90px] sm:max-w-[130px]">
                          <i className="fa-solid fa-location-dot text-[9px] text-slate-500 shrink-0"></i>
                          <span className="truncate">{player.region}</span>
                        </span>
                      </td>

                      {/* Daraja */}
                      <td className="p-2.5 sm:p-4 text-center font-bold text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] sm:text-xs text-amber-300 border border-slate-700">
                          Lv.{playerLevel}
                        </span>
                      </td>

                      {/* Jami EXP */}
                      <td className={`p-2.5 sm:p-4 text-right font-black font-mono ${isMe ? 'text-emerald-400 text-sm sm:text-base' : 'text-amber-300'}`}>
                        {playerExp.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">XP</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Status Banner when NOT in Top 20 */}
      {currentUser && !isCurrentUserInTop20 && (
        <div className="bg-slate-900 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-base shrink-0">
              <i className="fa-solid fa-ranking-star"></i>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white">
                Sizning natijangiz: {Number(userXP || currentUser.xp || 0).toLocaleString()} EXP (Daraja {Math.floor((userXP || currentUser.xp || 0) / 100)})
              </div>
              <p className="text-[11px] text-slate-400">
                {userRankInfo?.rank
                  ? `Siz umumiy reytingda #${userRankInfo.rank}-o'rindasiz. Top-20 talikka kirish uchun mashqlarni bajaring va EXP to'plang!`
                  : "Top-20 talikka kirish uchun mashqlarni bajaring va ko'proq EXP to'plang!"}
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl inline-block">
              Faqat Top-20 ko'rsatiladi
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
