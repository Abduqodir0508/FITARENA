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

export default function DuelTab({ currentUser, userXP, onAddXP, soundEnabled, onStartDuelSession, onEndDuelSession, onDuelFinished }) {
  const [isSearching, setIsSearching] = useState(false);
  const [inDuel, setInDuel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponent, setOpponent] = useState({
    name: "AI Sparring Bot",
    location: "Toshkent",
    xp: 0,
    speed: 2600,
  });
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

  const myDisplayName = currentUser?.fullName || `${currentUser?.firstName || 'Siz'} ${currentUser?.lastName || ''}`.trim() || "Siz (Mening Profilim)";
  const myRegion = currentUser?.region || "Toshkent shahri";

  // Automatic score increment from live camera pushup detection
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

      const leftArmVis = (lm[11]?.visibility || 0) > 0.4 && (lm[13]?.visibility || 0) > 0.4 && (lm[15]?.visibility || 0) > 0.4;
      const rightArmVis = (lm[12]?.visibility || 0) > 0.4 && (lm[14]?.visibility || 0) > 0.4 && (lm[16]?.visibility || 0) > 0.4;

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
          xp: Number(data.opponentXP) || 0,
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

  // Start Search / Matchmaking
  const startSearch = async () => {
    setIsSearching(true);
    playBeep(587, 'sine', 0.1, soundEnabled);

    if (!isWebcamActive) {
      toggleDuelWebcam();
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_queue', {
        name: myDisplayName,
        location: myRegion,
        xp: Number(userXP) || 0,
      });
    }

    // Try finding real opponents from Backend DB
    let realCandidate = null;
    try {
      const res = await fetch('/api/rankings');
      const data = await res.json();
      if (data.success && data.rankings && data.rankings.length > 0) {
        // Find other users besides current user
        const others = data.rankings.filter((u) => u.id !== currentUser?.id);
        if (others.length > 0) {
          const picked = others[Math.floor(Math.random() * others.length)];
          realCandidate = {
            name: picked.fullName || picked.name,
            location: picked.region || "Toshkent",
            xp: Number(picked.exp) || 0,
            speed: Math.floor(Math.random() * 800) + 2200,
          };
        }
      }
    } catch (e) {}

    searchTimeoutRef.current = setTimeout(() => {
      const opp = realCandidate || {
        name: "AI Sparring Trener",
        location: myRegion,
        xp: Math.max(0, (Number(userXP) || 0) + (Math.random() > 0.5 ? 20 : -10)),
        speed: 2500,
      };
      setOpponent(opp);
      setIsSearching(false);
      startMatch(opp);
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
    }, activeOpponent.speed || 2500);
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

  // Duel Finish: +150 EXP for winner, +25 EXP for runner-up
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

    if (onDuelFinished) {
      onDuelFinished(won, userScore);
    }

    if (won) {
      playSuccessFanfare(soundEnabled);
      // G'olibga to'g'ridan-to'g'ri +150 EXP beriladi
      onAddXP(150, userScore, true);
    } else {
      playDefeatSound(soundEnabled);
      // Mag'lubga rag'batlantiruvchi +25 EXP beriladi
      onAddXP(25, userScore, false);
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
    <section className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Duel Header & Matchmaking Panel — Mobile responsive text */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 border border-red-500/30 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>JONLI PVP JANG MAYDONI</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-wide text-white">
              60 Soniyalik Jonli Kamera Duellari
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Kamerangizni yoqing va jonli kadrda bellashing. G'olibga to'g'ridan-to'g'ri <strong className="text-amber-300 font-bold">+150 EXP</strong> beriladi!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={startSearch}
              disabled={isSearching || inDuel}
              className={`bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 ${
                isSearching || inDuel ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>{inDuel ? "Duel Davom Etmoqda" : "Raqib Qidirish (Matchmaking)"}</span>
            </button>
          </div>
        </div>

        {/* Searching banner */}
        {isSearching && (
          <div className="mt-4 sm:mt-6 bg-slate-950/90 border border-cyan-500/40 p-3 sm:p-4 rounded-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-cyan-300">Raqib qidirilmoqda...</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Kamera faollashmoqda | Server: Jonli</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Player 1 (You) with Integrated Live Camera */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-0.5 sm:py-1 rounded-bl-xl tracking-wider z-20">
            Siz (Jonli Kamera)
          </div>

          {/* User Card Header */}
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-sm sm:text-base">
                  <i className="fa-solid fa-user-ninja"></i>
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-base text-white truncate max-w-[130px] sm:max-w-none">{myDisplayName}</h3>
                <p className="text-[10px] sm:text-xs text-emerald-400 flex items-center space-x-1">
                  <i className="fa-solid fa-location-dot text-[9px]"></i>
                  <span>{myRegion} • {userXP} EXP</span>
                </p>
              </div>
            </div>

            {/* Toggle Camera button */}
            <button
              onClick={toggleDuelWebcam}
              className={`text-[11px] sm:text-xs px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center space-x-1 shrink-0 ${
                isWebcamActive
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              <i className="fa-solid fa-video text-[10px]"></i>
              <span className="hidden xs:inline">{isWebcamActive ? "O'chirish" : "Kamera"}</span>
            </button>
          </div>

          {/* Live User Viewport & Video Screen */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 h-[190px] sm:h-[230px] flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                isWebcamActive ? 'block' : 'hidden'
              }`}
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
            />

            {!isWebcamActive && (
              <div className="p-3 text-center z-0">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg mx-auto mb-1.5">
                  <i className="fa-solid fa-camera"></i>
                </div>
                <div className="text-xs font-bold text-slate-200">Kamera Ulanmagan</div>
                <button
                  onClick={toggleDuelWebcam}
                  className="mt-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-3 py-1 rounded-xl text-xs inline-flex items-center space-x-1 shadow active:scale-95"
                >
                  <i className="fa-solid fa-video text-[10px]"></i>
                  <span>Yoqish</span>
                </button>
              </div>
            )}

            {/* Live Score Overlay Tag */}
            <div className="absolute top-2 left-2 z-20 bg-slate-950/85 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-slate-700/80 text-[10px] text-slate-200">
              {isWebcamActive && isAiDetecting ? (
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AI: {currentAngle}°</span>
                </span>
              ) : isWebcamActive ? (
                <span className="text-amber-400">Odam kutilmoqda...</span>
              ) : (
                <span>Kamera o'chiq</span>
              )}
            </div>

            {/* Rep score HUD */}
            <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-500/50 shadow-xl flex items-center space-x-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400">Siz:</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{userScore}</span>
            </div>
          </div>

          {/* Self action test button */}
          <div className="mt-2.5 flex space-x-2">
            <button
              onClick={handleManualRep}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 min-h-[40px]"
            >
              <i className="fa-solid fa-arrow-up text-[10px]"></i>
              <span>+1 Otjimaniya (AI Test)</span>
            </button>
          </div>
        </div>

        {/* Center Match Timer Indicator */}
        <div className="md:col-span-2 flex items-center justify-center -my-1 sm:-my-2 relative z-20">
          <div className="bg-slate-950 border-2 border-red-500/60 px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl flex items-center space-x-3 sm:space-x-4 shadow-2xl">
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Vaqt</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-red-400 leading-none">{mins}:{secs}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xs sm:text-sm">
              VS
            </div>
            <div className="text-left">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Holat</div>
              <div className={`text-xs font-bold leading-none ${inDuel ? 'text-red-400 animate-pulse font-black' : 'text-amber-400'}`}>
                {matchStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 (Opponent) */}
        <div className="bg-slate-900/90 border-2 border-red-500/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 relative flex flex-col justify-between overflow-hidden shadow-xl shadow-red-500/10">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-0.5 sm:py-1 rounded-bl-xl tracking-wider z-20">
            Raqib
          </div>

          {/* Opponent Card Header */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 mb-2.5 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 p-0.5 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-red-400 font-bold text-sm sm:text-base">
                <i className="fa-solid fa-robot"></i>
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-base text-white truncate max-w-[130px] sm:max-w-none">{opponent.name}</h3>
              <p className="text-[10px] sm:text-xs text-red-400 flex items-center space-x-1">
                <i className="fa-solid fa-location-dot text-[9px]"></i>
                <span>{opponent.location} • {opponent.xp} EXP</span>
              </p>
            </div>
          </div>

          {/* Opponent Viewport Screen */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 h-[190px] sm:h-[230px] flex flex-col items-center justify-center p-3">
            <div className="relative flex items-center justify-center my-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl sm:text-3xl text-red-400 animate-pulse">
                <i className="fa-solid fa-user-ninja"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></div>
            </div>

            <div className="absolute top-2 left-2 z-20 bg-slate-950/85 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-slate-700/80 text-[10px] text-slate-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              <span>AI Duel Stream</span>
            </div>

            <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-red-500/50 shadow-xl flex items-center space-x-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400">Raqib:</span>
              <span className={`text-xl sm:text-2xl font-black text-red-400 transition-transform duration-200 ${
                oppPulse ? 'scale-125 text-red-300' : ''
              }`}>
                {opponentScore}
              </span>
            </div>
          </div>

          <div className="mt-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              AI Pose: <strong className="text-slate-200">Jonli Tekshiruv Faol</strong>
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
