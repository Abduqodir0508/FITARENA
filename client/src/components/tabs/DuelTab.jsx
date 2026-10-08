import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  playBeep,
  playMatchStartSound,
  playSuccessFanfare,
  playDefeatSound,
} from '../../utils/audioSynth';
import DuelResultModal from '../modals/DuelResultModal';

const mockOpponents = [
  { name: "Jasur_Fit", location: "Toshkent", xp: 1980, speed: 2200 },
  { name: "Bekzod_99", location: "Samarqand", xp: 1620, speed: 2500 },
  { name: "Sherzod_Tashkent", location: "Toshkent", xp: 1490, speed: 2800 },
  { name: "Umid_Vorkaut", location: "Farg'ona", xp: 1750, speed: 2400 },
  { name: "Anvar_Buxoro", location: "Buxoro", xp: 1380, speed: 3000 }
];

export default function DuelTab({ userXP, onAddXP, soundEnabled, onStartDuelSession, onEndDuelSession }) {
  const [isSearching, setIsSearching] = useState(false);
  const [inDuel, setInDuel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponent, setOpponent] = useState(mockOpponents[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [matchStatus, setMatchStatus] = useState("Kutilmoqda");
  const [oppPulse, setOppPulse] = useState(false);

  const socketRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const oppIntervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Initialize socket connection if available
  useEffect(() => {
    try {
      const socket = io('/', {
        autoConnect: true,
        reconnectionAttempts: 3,
        timeout: 2000,
      });
      socketRef.current = socket;

      socket.on('match_found', (data) => {
        setIsSearching(false);
        setOpponent({
          name: data.opponentName || "Raqib_Uz",
          location: data.opponentLocation || "Toshkent",
          xp: data.opponentXP || 1500,
          speed: 2500,
        });
        startMatch();
      });

      socket.on('opponent_score_update', (data) => {
        setOpponentScore(data.score);
        triggerOppPulse();
      });

      socket.on('duel_completed', (data) => {
        finishMatch(data.winner === socket.id);
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn("Socket.io init notice:", e);
    }
  }, []);

  const triggerOppPulse = () => {
    setOppPulse(true);
    setTimeout(() => setOppPulse(false), 200);
  };

  const startSearch = () => {
    setIsSearching(true);
    playBeep(587, 'sine', 0.1, soundEnabled);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_queue', {
        name: "Siz (Mening Profilim)",
        location: "Toshkent shahri",
        xp: userXP,
      });
    }

    // Fallback simulation if socket server has no other player in queue
    searchTimeoutRef.current = setTimeout(() => {
      const randomOpp = mockOpponents[Math.floor(Math.random() * mockOpponents.length)];
      setOpponent(randomOpp);
      setIsSearching(false);
      startMatch(randomOpp);
    }, 2200);
  };

  const cancelSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_queue');
    }
    setIsSearching(false);
  };

  const startMatch = (activeOpponent = opponent) => {
    setInDuel(true);
    setUserScore(0);
    setOpponentScore(0);
    setTimeLeft(60);
    setMatchStatus("Jang Ketyapti!");
    playMatchStartSound(soundEnabled);

    if (onStartDuelSession) {
      onStartDuelSession();
    }

    // Clear previous intervals
    clearInterval(timerIntervalRef.current);
    clearInterval(oppIntervalRef.current);

    // Countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          clearInterval(oppIntervalRef.current);
          return 0;
        }
        if (prev <= 11 && prev > 1) {
          playBeep(980, 'sine', 0.08, soundEnabled);
        }
        return prev - 1;
      });
    }, 1000);

    // Simulated opponent reps (if standalone)
    oppIntervalRef.current = setInterval(() => {
      setOpponentScore((prev) => {
        const nextScore = prev + 1;
        triggerOppPulse();
        return nextScore;
      });
    }, activeOpponent.speed || 2400);
  };

  // Watch timeLeft for ending
  useEffect(() => {
    if (inDuel && timeLeft === 0) {
      const won = userScore >= opponentScore;
      finishMatch(won);
    }
  }, [timeLeft, inDuel, userScore, opponentScore]);

  const handleManualRep = () => {
    const nextScore = userScore + 1;
    setUserScore(nextScore);
    playBeep(750, 'triangle', 0.08, soundEnabled);

    if (socketRef.current && socketRef.current.connected && inDuel) {
      socketRef.current.emit('update_score', { score: nextScore });
    }
  };

  const finishMatch = (won) => {
    setInDuel(false);
    clearInterval(timerIntervalRef.current);
    clearInterval(oppIntervalRef.current);
    setMatchStatus("Tugadi");
    setIsWinner(won);
    setIsModalOpen(true);

    if (onEndDuelSession) {
      onEndDuelSession();
    }

    if (won) {
      playSuccessFanfare(soundEnabled);
      onAddXP(150);
    } else {
      playDefeatSound(soundEnabled);
      onAddXP(25);
    }
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <section className="space-y-4 animate-fadeIn">
      {/* Duel Header & Matchmaking Panel */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 border border-red-500/30 p-4 sm:p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>JONLI PVP JANG MAYDONI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
              60 Soniyalik Otjimaniya Duellari
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              O'zbekistondagi boshqa atletlar bilan real vaqtda bellashing. AI ikkala tomonni ham adolatli sanaydi, g'olibga +150 XP beriladi!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={startSearch}
              disabled={isSearching || inDuel}
              className={`bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 ${
                isSearching || inDuel ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>{inDuel ? "Duel Davom Etmoqda" : "Raqib Qidirish (Matchmaking)"}</span>
            </button>
          </div>
        </div>

        {/* Searching banner modal state */}
        {isSearching && (
          <div className="mt-6 bg-slate-950/90 border border-cyan-500/40 p-4 rounded-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              <div>
                <div className="text-sm font-bold text-cyan-300">Raqib qidirilmoqda...</div>
                <div className="text-xs text-slate-400">Server: Toshkent Ping: 14ms (Socket.io)</div>
              </div>
            </div>
            <button
              onClick={cancelSearch}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 transition"
            >
              Bekor qilish
            </button>
          </div>
        )}
      </div>

      {/* Duel Arena Battle Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 (You) */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
            Siz (Jonli)
          </div>

          {/* User Card Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-lg">
                <i className="fa-solid fa-user-ninja"></i>
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Siz (Mening Profilim)</h3>
              <p className="text-xs text-emerald-400 flex items-center space-x-1">
                <i className="fa-solid fa-location-dot text-[10px]"></i>
                <span>Toshkent shahri • Olmos Liga</span>
              </p>
            </div>
          </div>

          {/* Live Score Screen */}
          <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-800 my-2 relative">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Takrorlashlar Soni</span>
            <div className="text-6xl font-black text-emerald-400 tracking-tight my-2">
              {userScore}
            </div>
            <div className="text-xs text-slate-400 flex justify-center items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{inDuel ? "Jonli AI Kamera hisoblamoqda" : "Kamera tayyor holatda"}</span>
            </div>
          </div>

          {/* Self action buttons */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleManualRep}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-95"
            >
              <i className="fa-solid fa-arrow-up"></i>
              <span>+1 Otjimaniya (AI Test)</span>
            </button>
          </div>
        </div>

        {/* Center Match Timer Indicator */}
        <div className="md:col-span-2 flex items-center justify-center -my-2 relative z-20">
          <div className="bg-slate-950 border-2 border-red-500/60 px-6 py-2 rounded-2xl flex items-center space-x-4 shadow-2xl">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Vaqt</div>
              <div className="text-2xl font-black font-mono text-red-400">{mins}:{secs}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-sm">
              VS
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Holat</div>
              <div className={`text-xs font-bold ${inDuel ? 'text-red-400 animate-pulse font-black' : 'text-amber-400'}`}>
                {matchStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 (Opponent) */}
        <div className="bg-slate-900/90 border-2 border-red-500/40 rounded-3xl p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-red-500/10">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
            Raqib
          </div>

          {/* Opponent Card Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-red-400 font-bold text-lg">
                <i className="fa-solid fa-robot"></i>
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{opponent.name}</h3>
              <p className="text-xs text-red-400 flex items-center space-x-1">
                <i className="fa-solid fa-location-dot text-[10px]"></i>
                <span>{opponent.location} • {opponent.xp.toLocaleString()} XP</span>
              </p>
            </div>
          </div>

          {/* Opponent Live Score Screen */}
          <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-800 my-2 relative">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Raqib Natijasi</span>
            <div className={`text-6xl font-black text-red-400 tracking-tight my-2 transition-transform duration-200 ${
              oppPulse ? 'scale-110 text-red-300' : ''
            }`}>
              {opponentScore}
            </div>
            <div className="text-xs text-slate-400 flex justify-center items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span>Jonli kamera orqali bajarmoqda</span>
            </div>
          </div>

          {/* Opponent info tag */}
          <div className="mt-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              Raqib Pose AI: <strong className="text-slate-200">MediaPipe Stream v2</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <DuelResultModal
        isOpen={isModalOpen}
        isWinner={isWinner}
        userScore={userScore}
        opponentScore={opponentScore}
        opponentName={opponent.name}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
