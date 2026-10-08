import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  playBeep,
  playMatchStartSound,
  playSuccessFanfare,
  playDefeatSound,
} from '../../utils/audioSynth';
import {
  calculate3PointAngle,
  drawRealPoseLandmarks,
} from '../../utils/poseKinematics';
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

  // Live Camera states inside Duel
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(170);
  const [isAiDetecting, setIsAiDetecting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cameraHelperRef = useRef(null);
  const poseEngineRef = useRef(null);
  const socketRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const oppIntervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const inRepCycleRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const inDuelRef = useRef(false);
  const isWebcamActiveRef = useRef(false);

  inDuelRef.current = inDuel;
  isWebcamActiveRef.current = isWebcamActive;

  // Handle automatic score increment from live camera pushup detection
  const handleCameraRep = useCallback(() => {
    const now = Date.now();
    if (now - lastRepTimeRef.current < 450) return;
    lastRepTimeRef.current = now;

    setUserScore((prev) => {
      const nextScore = prev + 1;
      playBeep(750, 'triangle', 0.08, soundEnabled);

      if (socketRef.current && socketRef.current.connected && inDuelRef.current) {
        socketRef.current.emit('update_score', { score: nextScore });
      }
      return nextScore;
    });
  }, [soundEnabled]);

  // Real-time MediaPipe Pose processor for Duel camera
  const handleDuelPoseResults = useCallback((results) => {
    if (!isWebcamActiveRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 240;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const lm = results.poseLandmarks;

      const leftArmVis = (lm[11]?.visibility || 0) > 0.5 && (lm[13]?.visibility || 0) > 0.5 && (lm[15]?.visibility || 0) > 0.5;
      const rightArmVis = (lm[12]?.visibility || 0) > 0.5 && (lm[14]?.visibility || 0) > 0.5 && (lm[16]?.visibility || 0) > 0.5;

      if (!leftArmVis && !rightArmVis) {
        setIsAiDetecting(false);
        return;
      }

      setIsAiDetecting(true);
      const leftElbowAngle = calculate3PointAngle(lm[11], lm[13], lm[15]);
      const rightElbowAngle = calculate3PointAngle(lm[12], lm[14], lm[16]);
      let calculatedAngle = rightArmVis ? rightElbowAngle : leftElbowAngle;
      calculatedAngle = Math.max(40, Math.min(180, calculatedAngle));
      setCurrentAngle(calculatedAngle);

      // Duel Pushup Rep Cycle: Low <= 90 deg, High >= 155 deg
      if (calculatedAngle <= 90 && !inRepCycleRef.current) {
        inRepCycleRef.current = true;
        playBeep(440, 'sine', 0.05, soundEnabled);
      } else if (calculatedAngle >= 155 && inRepCycleRef.current) {
        inRepCycleRef.current = false;
        handleCameraRep();
      }

      drawRealPoseLandmarks(ctx, lm, width, height, 'pushups', calculatedAngle);
    } else {
      setIsAiDetecting(false);
    }
  }, [soundEnabled, handleCameraRep]);

  // Turn ON / OFF Camera in Duel
  const toggleDuelWebcam = async () => {
    if (isWebcamActive) {
      if (cameraHelperRef.current) {
        cameraHelperRef.current.stop();
        cameraHelperRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
      setIsAiDetecting(false);
      return;
    }

    try {
      if (window.Pose && !poseEngineRef.current) {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(handleDuelPoseResults);
        poseEngineRef.current = pose;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (window.Camera && poseEngineRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && isWebcamActiveRef.current && poseEngineRef.current) {
                await poseEngineRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          cameraHelperRef.current = camera;
        }
      }

      setIsWebcamActive(true);
    } catch (err) {
      console.warn("Duel camera error:", err);
      alert("Kameraga ulanib bo'lmadi. Brauzerda ruxsat bering!");
    }
  };

  // Socket setup
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
      console.warn("Socket.io notice:", e);
    }
  }, []);

  const triggerOppPulse = () => {
    setOppPulse(true);
    setTimeout(() => setOppPulse(false), 200);
  };

  const startSearch = () => {
    setIsSearching(true);
    playBeep(587, 'sine', 0.1, soundEnabled);

    // Auto-turn on camera if not active yet
    if (!isWebcamActive) {
      toggleDuelWebcam();
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_queue', {
        name: "Siz (Mening Profilim)",
        location: "Toshkent shahri",
        xp: userXP,
      });
    }

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

    clearInterval(timerIntervalRef.current);
    clearInterval(oppIntervalRef.current);

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

    oppIntervalRef.current = setInterval(() => {
      setOpponentScore((prev) => {
        const nextScore = prev + 1;
        triggerOppPulse();
        return nextScore;
      });
    }, activeOpponent.speed || 2400);
  };

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraHelperRef.current) cameraHelperRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      clearInterval(timerIntervalRef.current);
      clearInterval(oppIntervalRef.current);
    };
  }, []);

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
              60 Soniyalik Jonli Kamera Duellari
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Kamerangizni yoqing va raqib bilan to'g'ridan-to'g'ri jonli kadrda bellashing. AI ikkala tomonni ham adolatli sanaydi, g'olibga +150 XP beriladi!
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
                <div className="text-xs text-slate-400">Kamera faollashmoqda | Server: Toshkent</div>
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
        {/* Player 1 (You) with Integrated Live Camera */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider z-20">
            Siz (Jonli Kamera)
          </div>

          {/* User Card Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-base">
                  <i className="fa-solid fa-user-ninja"></i>
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">Siz (Mening Profilim)</h3>
                <p className="text-xs text-emerald-400 flex items-center space-x-1">
                  <i className="fa-solid fa-location-dot text-[10px]"></i>
                  <span>Toshkent shahri • Olmos Liga</span>
                </p>
              </div>
            </div>

            {/* Toggle Camera button in player card */}
            <button
              onClick={toggleDuelWebcam}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1.5 ${
                isWebcamActive
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              <i className="fa-solid fa-video"></i>
              <span>{isWebcamActive ? "Kamera O'chirish" : "Kamerani Yoqish"}</span>
            </button>
          </div>

          {/* Live User Viewport & Video Screen */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[200px] sm:min-h-[230px] flex flex-col items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                isWebcamActive ? 'block' : 'hidden'
              }`}
            />

            {/* Live Canvas for MediaPipe skeleton */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
            />

            {/* Placeholder when Camera is off */}
            {!isWebcamActive && (
              <div className="p-4 text-center z-0">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl mx-auto mb-2">
                  <i className="fa-solid fa-camera"></i>
                </div>
                <div className="text-xs font-bold text-slate-200">Kamera Ulanmagan</div>
                <button
                  onClick={toggleDuelWebcam}
                  className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center space-x-1.5 shadow"
                >
                  <i className="fa-solid fa-video"></i>
                  <span>Kamerani Yoqish</span>
                </button>
              </div>
            )}

            {/* Live Score Overlay Tag */}
            <div className="absolute top-2 left-2 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/80 text-[11px] text-slate-200">
              {isWebcamActive && isAiDetecting ? (
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AI: {currentAngle}° (Jonli)</span>
                </span>
              ) : isWebcamActive ? (
                <span className="text-amber-400 font-medium">Odam kutilmoqda...</span>
              ) : (
                <span>Kamera o'chiq</span>
              )}
            </div>

            {/* Rep score HUD inside video */}
            <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-emerald-500/50 shadow-xl flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Siz:</span>
              <span className="text-2xl font-black text-emerald-400">{userScore}</span>
            </div>
          </div>

          {/* Self action test button */}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleManualRep}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-95"
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

        {/* Player 2 (Opponent) with Holographic Live Battle Feed */}
        <div className="bg-slate-900/90 border-2 border-red-500/40 rounded-3xl p-4 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-red-500/10">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider z-20">
            Raqib
          </div>

          {/* Opponent Card Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-red-400 font-bold text-base">
                <i className="fa-solid fa-robot"></i>
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">{opponent.name}</h3>
              <p className="text-xs text-red-400 flex items-center space-x-1">
                <i className="fa-solid fa-location-dot text-[10px]"></i>
                <span>{opponent.location} • {opponent.xp.toLocaleString()} XP</span>
              </p>
            </div>
          </div>

          {/* Opponent Viewport Screen */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[200px] sm:min-h-[230px] flex flex-col items-center justify-center p-4">
            {/* Holographic Arena Animated Icon */}
            <div className="relative flex items-center justify-center my-auto">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl text-red-400 animate-pulse">
                <i className="fa-solid fa-user-ninja"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-ping"></div>
            </div>

            {/* Opponent Tag */}
            <div className="absolute top-2 left-2 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span>WebRTC Stream v2: Jonli</span>
            </div>

            {/* Opponent Live Score HUD inside viewport */}
            <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-red-500/50 shadow-xl flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Raqib:</span>
              <span className={`text-2xl font-black text-red-400 transition-transform duration-200 ${
                oppPulse ? 'scale-125 text-red-300' : ''
              }`}>
                {opponentScore}
              </span>
            </div>
          </div>

          {/* Opponent info tag */}
          <div className="mt-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              Raqib AI Pose: <strong className="text-slate-200">MediaPipe Stream Faol</strong>
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
