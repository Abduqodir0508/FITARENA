import React, { useState, useEffect } from 'react';

const initialMockLeaderboard = [
  { rank: 1, name: "Jasur_Fit", region: "Toshkent", duels: "24 / 28", reps: 1120, badge: "Olmos" },
  { rank: 2, name: "Bekzod_99", region: "Samarqand", duels: "19 / 22", reps: 840, badge: "Olmos" },
  { rank: 3, name: "Umid_Vorkaut", region: "Farg'ona", duels: "17 / 20", reps: 760, badge: "Oltin" },
  { rank: 4, name: "Sherzod_Tashkent", region: "Toshkent", duels: "14 / 18", reps: 690, badge: "Oltin" },
  { rank: 5, name: "Anvar_Buxoro", region: "Buxoro", duels: "12 / 15", reps: 620, badge: "Kumush" },
  { rank: 6, name: "Doston_Andijon", region: "Andijon", duels: "11 / 14", reps: 580, badge: "Kumush" },
  { rank: 7, name: "Xurshid_Xorazm", region: "Xorazm", duels: "9 / 12", reps: 510, badge: "Bronza" },
  { rank: 8, name: "Sardor_Qashqadaryo", region: "Qashqadaryo", duels: "8 / 11", reps: 490, badge: "Bronza" }
];

export default function RankingTab() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [leaderboard, setLeaderboard] = useState(initialMockLeaderboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const query = selectedRegion === 'all' ? '' : `?region=${encodeURIComponent(selectedRegion)}`;
        const res = await fetch(`/api/rankings${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.rankings)) {
            setLeaderboard(data.rankings);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to local filter
      }

      const filtered = selectedRegion === 'all'
        ? initialMockLeaderboard
        : initialMockLeaderboard.filter(
            (p) => p.region.toLowerCase() === selectedRegion.toLowerCase()
          );
      setLeaderboard(filtered);
      setLoading(false);
    };

    fetchRankings();
  }, [selectedRegion]);

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
            Haftalik eng ko'p toza takrorlash bajargan va duel yutgan chempionlar
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
            <option value="Toshkent">Toshkent</option>
            <option value="Samarqand">Samarqand</option>
            <option value="Farg'ona">Farg'ona</option>
            <option value="Andijon">Andijon</option>
            <option value="Buxoro">Buxoro</option>
            <option value="Xorazm">Xorazm</option>
            <option value="Qashqadaryo">Qashqadaryo</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 2nd place */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-center order-2 sm:order-1 relative shadow-lg">
          <div className="w-7 h-7 rounded-full bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center mx-auto mb-2">
            2
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 mx-auto flex items-center justify-center text-slate-300 text-xl font-bold mb-2">
            <i className="fa-solid fa-user-ninja"></i>
          </div>
          <h4 className="text-sm font-bold text-white">Bekzod_99</h4>
          <span className="text-[11px] text-slate-400">Samarqand</span>
          <div className="mt-2 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
            840 Takrorlash
          </div>
        </div>

        {/* 1st place Champion */}
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
          <h4 className="text-base font-extrabold text-white">Jasur_Fit</h4>
          <span className="text-xs text-amber-400 font-semibold">Toshkent • 12 G'alaba Seriyasi</span>
          <div className="mt-3 text-sm font-black text-amber-300 bg-amber-500/20 py-1.5 rounded-xl border border-amber-500/30">
            1,120 Takrorlash
          </div>
        </div>

        {/* 3rd place */}
        <div className="bg-slate-900/80 border border-amber-800/60 rounded-2xl p-4 text-center order-3 sm:order-3 relative shadow-lg">
          <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mx-auto mb-2">
            3
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-700 mx-auto flex items-center justify-center text-amber-600 text-xl font-bold mb-2">
            <i className="fa-solid fa-dumbbell"></i>
          </div>
          <h4 className="text-sm font-bold text-white">Umid_Vorkaut</h4>
          <span className="text-[11px] text-slate-400">Farg'ona</span>
          <div className="mt-2 text-xs font-black text-slate-200 bg-slate-800 py-1 rounded-lg">
            760 Takrorlash
          </div>
        </div>
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    Bu viloyat bo'yicha hozircha ma'lumot yo'q
                  </td>
                </tr>
              ) : (
                leaderboard.map((player) => {
                  let badgeColor = 'bg-slate-800 text-slate-300';
                  if (player.badge === 'Olmos') {
                    badgeColor = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
                  } else if (player.badge === 'Oltin') {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
                  }

                  return (
                    <tr key={player.rank} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 sm:p-4 text-center font-bold font-mono text-slate-400">
                        #{player.rank}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{player.name}</span>
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
                      <td className="p-3 sm:p-4 text-right font-black text-white font-mono">
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
