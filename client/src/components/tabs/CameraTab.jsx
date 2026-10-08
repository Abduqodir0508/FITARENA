import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playBeep, playSuccessFanfare } from '../../utils/audioSynth';
import {
  calculate3PointAngle,
  calculateDynamicAngle,
  drawSkeletalCanvas,
  drawRealPoseLandmarks,
} from '../../utils/poseKinematics';

export default function CameraTab({ userXP, onAddXP, soundEnabled, onDuelRep }) {
  const [exercise, setExercise] = useState('pushups');
  const [targetReps, setTargetReps] = useState(15);
  const [currentReps, setCurrentReps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0.0);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(170);
  const [poseState, setPoseState] = useState({ text: 'Yuqori Nuqta', color: 'text-amber-400' });
  const [feedback, setFeedback] = useState({ text: "Kamerani yoqing yoki AI Demoni ko'ring", status: 'idle' });
  const [fps, setFps] = useState(60);
  const [isAiDetecting, setIsAiDetecting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseEngineRef = useRef(null);
  const cameraHelperRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const posePhaseRef = useRef(0);
  const inRepCycleRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const isWebcamActiveRef = useRef(false);
  const isSimulationActiveRef = useRef(false);
  const exerciseRef = useRef(exercise);

  exerciseRef.current = exercise;
  isWebcamActiveRef.current = isWebcamActive;
  isSimulationActiveRef.current = isSimulationActive;

  // Thresholds
  const repThresholdLow = exercise === 'pushups' ? 90 : exercise === 'squats' ? 95 : 110;
  const repThresholdHigh = exercise === 'pushups' ? 155 : exercise === 'squats' ? 155 : 150;

  const exerciseNames = {
    pushups: "Otjimaniya (Push-ups)",
    squats: "Prisedaniya (Squats)",
    press: "Press (Crunches)",
  };

  // Rep completion
  const handleRepCompletion = useCallback(() => {
    const now = Date.now();
    // Debounce to prevent rapid double-counting (at least 450ms between reps)
    if (now - lastRepTimeRef.current < 450) return;
    lastRepTimeRef.current = now;

    setCurrentReps((prev) => {
      const nextReps = prev + 1;
      setCaloriesBurned((c) => +(c + 0.45).toFixed(1));
      onAddXP(10);
      if (onDuelRep) {
        onDuelRep();
      }

      if (nextReps === targetReps) {
        playSuccessFanfare(soundEnabled);
        setFeedback({ text: "TABRIKLAYMIZ! Maqsad bajarildi! 🏆", status: 'success' });
      }
      return nextReps;
    });
  }, [targetReps, soundEnabled, onAddXP, onDuelRep]);

  // Real-time MediaPipe Pose processor
  const handleRealPoseResults = useCallback((results) => {
    if (!isWebcamActiveRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const lm = results.poseLandmarks;
      const currentEx = exerciseRef.current;

      // Check key joint visibility
      const leftArmVis = (lm[11]?.visibility || 0) > 0.5 && (lm[13]?.visibility || 0) > 0.5 && (lm[15]?.visibility || 0) > 0.5;
      const rightArmVis = (lm[12]?.visibility || 0) > 0.5 && (lm[14]?.visibility || 0) > 0.5 && (lm[16]?.visibility || 0) > 0.5;
      const leftLegVis = (lm[23]?.visibility || 0) > 0.5 && (lm[25]?.visibility || 0) > 0.5 && (lm[27]?.visibility || 0) > 0.5;
      const rightLegVis = (lm[24]?.visibility || 0) > 0.5 && (lm[26]?.visibility || 0) > 0.5 && (lm[28]?.visibility || 0) > 0.5;

      const hasVisibleBody = currentEx === 'squats' ? (leftLegVis || rightLegVis) : (leftArmVis || rightArmVis);

      if (!hasVisibleBody) {
        setIsAiDetecting(false);
        setFeedback({ text: "Masofani to'g'rilang: 1.5 - 2 metr uzoqlashing", status: 'idle' });
        return;
      }

      setIsAiDetecting(true);
      let calculatedAngle = 175;

      if (currentEx === 'pushups') {
        const leftElbowAngle = calculate3PointAngle(lm[11], lm[13], lm[15]);
        const rightElbowAngle = calculate3PointAngle(lm[12], lm[14], lm[16]);
        calculatedAngle = rightArmVis ? rightElbowAngle : leftElbowAngle;
      } else if (currentEx === 'squats') {
        const leftKneeAngle = calculate3PointAngle(lm[23], lm[25], lm[27]);
        const rightKneeAngle = calculate3PointAngle(lm[24], lm[26], lm[28]);
        calculatedAngle = rightLegVis ? rightKneeAngle : leftKneeAngle;
      } else {
        const leftTorsoAngle = calculate3PointAngle(lm[11], lm[23], lm[25]);
        const rightTorsoAngle = calculate3PointAngle(lm[12], lm[24], lm[26]);
        calculatedAngle = Math.min(leftTorsoAngle, rightTorsoAngle);
      }

      calculatedAngle = Math.max(40, Math.min(180, calculatedAngle));
      setCurrentAngle(calculatedAngle);

      // REAL REP COUNTER (Only on genuine full movement)
      if (calculatedAngle <= repThresholdLow && !inRepCycleRef.current) {
        inRepCycleRef.current = true;
        setPoseState({ text: "Quyi Nuqta (Zo'r!)", color: 'text-emerald-400' });
        setFeedback({ text: "Yaxshi chuqurlik! Endi ko'taring", status: 'low' });
        playBeep(440, 'sine', 0.06, soundEnabled);
      } else if (calculatedAngle >= repThresholdHigh && inRepCycleRef.current) {
        inRepCycleRef.current = false;
        setPoseState({ text: "Yuqori Nuqta", color: 'text-cyan-400' });
        setFeedback({ text: "Takrorlandi! +1 🔥", status: 'counted' });
        playBeep(880, 'triangle', 0.12, soundEnabled);
        handleRepCompletion();
      }

      // Draw real skeletal joints on live camera
      drawRealPoseLandmarks(ctx, lm, width, height, currentEx, calculatedAngle);
    } else {
      setIsAiDetecting(false);
      setFeedback({ text: "Odam qidirilmoqda... Kadrga to'liq kiring", status: 'idle' });
    }

    // FPS calculation
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, [repThresholdLow, repThresholdHigh, soundEnabled, handleRepCompletion]);

  // Initialize MediaPipe Pose Engine
  const initPoseEngine = useCallback(async () => {
    if (window.Pose) {
      try {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(handleRealPoseResults);
        poseEngineRef.current = pose;
        return pose;
      } catch (err) {
        console.warn("MediaPipe Pose load error:", err);
      }
    }
    return null;
  }, [handleRealPoseResults]);

  // Virtual AI Simulation loop (Only used when user explicitly clicks 'AI Demo' without camera)
  const runSimulationLoop = useCallback(() => {
    if (!isSimulationActiveRef.current || isWebcamActiveRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    posePhaseRef.current += 0.045;
    const cycleProgress = (Math.sin(posePhaseRef.current) + 1) / 2;

    const calculatedAngle = calculateDynamicAngle(exerciseRef.current, cycleProgress);
    setCurrentAngle(calculatedAngle);

    if (calculatedAngle <= repThresholdLow && !inRepCycleRef.current) {
      inRepCycleRef.current = true;
      setPoseState({ text: "Quyi Nuqta (Demo)", color: 'text-emerald-400' });
      setFeedback({ text: "Yaxshi chuqurlik! (Demo)", status: 'low' });
      playBeep(440, 'sine', 0.06, soundEnabled);
    } else if (calculatedAngle >= repThresholdHigh && inRepCycleRef.current) {
      inRepCycleRef.current = false;
      setPoseState({ text: "Yuqori Nuqta", color: 'text-cyan-400' });
      setFeedback({ text: "Takrorlandi! +1 🔥 (Demo)", status: 'counted' });
      playBeep(880, 'triangle', 0.12, soundEnabled);
      handleRepCompletion();
    }

    drawSkeletalCanvas(ctx, width, height, exerciseRef.current, cycleProgress, calculatedAngle);

    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    animFrameIdRef.current = requestAnimationFrame(runSimulationLoop);
  }, [repThresholdLow, repThresholdHigh, soundEnabled, handleRepCompletion]);

  // Turn ON / OFF Webcam
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      // Stop Camera
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
      inRepCycleRef.current = false;
      setFeedback({ text: "Kamera to'xtatildi", status: 'idle' });
      return;
    }

    // Start Real Camera with MediaPipe
    try {
      setIsSimulationActive(false);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      setFeedback({ text: "Kamera va AI Pose ishga tushirilmoqda...", status: 'idle' });

      let pose = poseEngineRef.current;
      if (!pose) {
        pose = await initPoseEngine();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Feed video frames directly to MediaPipe Pose
        if (window.Camera && pose) {
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
        } else {
          // Manual requestAnimationFrame pipeline fallback
          const processFrame = async () => {
            if (!isWebcamActiveRef.current) return;
            if (videoRef.current && poseEngineRef.current && videoRef.current.readyState >= 2) {
              await poseEngineRef.current.send({ image: videoRef.current });
            }
            requestAnimationFrame(processFrame);
          };
          requestAnimationFrame(processFrame);
        }
      }

      setIsWebcamActive(true);
      inRepCycleRef.current = false;
      setFeedback({ text: "To'g'ri turing! Harakat qilganingizdagina sanaydi", status: 'idle' });
    } catch (err) {
      console.warn("Kamera ruxsati berilmadi:", err);
      alert("Kameraga ruxsat berilmadi yoki ulanmadi. Brauzerda kameraga ruxsat bering!");
    }
  };

  // Toggle AI Demo (Virtual Simulation)
  const toggleSimulation = () => {
    if (isWebcamActive) {
      // If camera is on, stop camera first
      toggleWebcam();
    }

    if (isSimulationActive) {
      setIsSimulationActive(false);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setFeedback({ text: "AI Demo to'xtatildi", status: 'idle' });
    } else {
      setIsSimulationActive(true);
      setFeedback({ text: "AI Demo (Virtual Rejim) ishga tushdi", status: 'idle' });
      animFrameIdRef.current = requestAnimationFrame(runSimulationLoop);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraHelperRef.current) cameraHelperRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const handleReset = () => {
    setCurrentReps(0);
    setCaloriesBurned(0);
    inRepCycleRef.current = false;
    setFeedback({ text: "Hisob qaytarildi. Mashqni boshlang!", status: 'idle' });
  };

  const adjustTarget = (delta) => {
    setTargetReps((prev) => Math.max(5, prev + delta));
  };

  const handleExerciseChange = (e) => {
    setExercise(e.target.value);
    handleReset();
  };

  const pct = Math.min(currentReps / targetReps, 1.0);
  const circleOffset = 175.9 - 175.9 * pct;

  return (
    <section className="space-y-4 animate-fadeIn">
      {/* Anti-cheat banner for mobile */}
      <div className="sm:hidden flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl text-[11px] text-emerald-300">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live"></span>
          <span>Faqat jonli harakat orqali ishlaydi (Harakat qilmasangiz sanamaydi)</span>
        </div>
        <i className="fa-solid fa-shield-halved text-emerald-400"></i>
      </div>

      {/* Exercise Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111827] border border-cyberBorder p-3 rounded-2xl shadow-lg">
        {/* Exercise type */}
        <div>
          <label className="block text-[11px] text-slate-400 font-semibold mb-1">MASHQ TURI</label>
          <select
            value={exercise}
            onChange={handleExerciseChange}
            className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
          >
            <option value="pushups">Otjimaniya (Push-ups)</option>
            <option value="squats">Prisedaniya (Squats)</option>
            <option value="press">Press (Crunches)</option>
          </select>
        </div>

        {/* Camera and Sim Buttons */}
        <div>
          <label className="block text-[11px] text-slate-400 font-semibold mb-1">REJIM VA MANBA</label>
          <div className="flex space-x-2">
            <button
              onClick={toggleWebcam}
              className={`flex-1 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition ${
                isWebcamActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
              }`}
            >
              <i className="fa-solid fa-video"></i>
              <span>{isWebcamActive ? "Kamerani O'chirish" : "Kamerani Yoqish"}</span>
            </button>
            <button
              onClick={toggleSimulation}
              className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition ${
                isSimulationActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-cyan-500/30'
              }`}
              title="Kamerasiz virtual AI namoyishini ko'rish"
            >
              <i className="fa-solid fa-robot"></i>
              <span>{isSimulationActive ? "Demoni to'xtatish" : "AI Demo"}</span>
            </button>
          </div>
        </div>

        {/* Target Reps */}
        <div>
          <label className="block text-[11px] text-slate-400 font-semibold mb-1">MAQSAD (TAKRORLASH)</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => adjustTarget(-5)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-slate-200 transition active:scale-95"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-emerald-400 text-lg bg-slate-900/80 py-1 rounded-xl border border-slate-800">
              {targetReps}
            </div>
            <button
              onClick={() => adjustTarget(5)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-slate-200 transition active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-rotate-left text-amber-400"></i>
            <span>Hisobni Qaytarish</span>
          </button>
        </div>
      </div>

      {/* Main Video & AI Skeleton Canvas Viewport */}
      <div className="relative bg-slate-950 border border-cyberBorder rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[380px] md:min-h-[490px]">
        {/* Mirrored live webcam video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            isWebcamActive ? 'block' : 'hidden'
          }`}
        />

        {/* Canvas for rendering real AI detected skeleton or demo skeleton */}
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full h-full max-h-[500px] object-contain pointer-events-none"
        />

        {/* Camera Off Placeholder */}
        {!isWebcamActive && !isSimulationActive && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 text-3xl animate-pulse">
              <i className="fa-solid fa-camera-rotate"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Kamera Ulanmagan</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              "Kamerani Yoqish" tugmasini bosing. AI sizning tirsak, yelka va tizza harakatlaringizni jonli kuzatadi va faqat to'liq bukilgandagina sanaydi!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={toggleWebcam}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <i className="fa-solid fa-video"></i>
                <span>Kamerani Yoqish</span>
              </button>
              <button
                onClick={toggleSimulation}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 active:scale-95"
              >
                <i className="fa-solid fa-play"></i>
                <span>AI Demoni Ko'rish</span>
              </button>
            </div>
          </div>
        )}

        {/* Top-Left Engine HUD */}
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-md">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isWebcamActive && isAiDetecting
                  ? 'bg-emerald-400 animate-pulse'
                  : isWebcamActive
                  ? 'bg-amber-400 animate-pulse'
                  : isSimulationActive
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            ></div>
            <span className="text-xs font-bold text-slate-200">
              {isWebcamActive && isAiDetecting
                ? "Jonli AI Biometriya: Odam Aniqlangan"
                : isWebcamActive
                ? "Kamera Faol: Odam kutilmoqda"
                : isSimulationActive
                ? "AI Demo: Virtual Skelet"
                : "AI Pose Engine: Kutilmoqda"}
            </span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-xl text-[11px] text-slate-300">
            Haqiqiy Burchak: <span className="font-mono font-bold text-emerald-400">{currentAngle}°</span>
          </div>
        </div>

        {/* Top-Right Feedback HUD */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2 pointer-events-none">
          <div
            className={`backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center space-x-2 transition-all duration-300 border ${
              feedback.status === 'counted' || feedback.status === 'success'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 scale-105'
                : feedback.status === 'low'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-200'
            }`}
          >
            <i className="fa-solid fa-circle-check"></i>
            <span>{feedback.text}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-400 border border-slate-800">
            FPS: <span className="text-cyan-400 font-mono">{fps}</span> | Anti-cheat: <span className="text-emerald-400 font-bold">JONLI</span>
          </div>
        </div>

        {/* Large Floating REP Counter HUD */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center items-center pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-emerald-500/40 rounded-2xl px-6 py-3 flex items-center space-x-6 shadow-2xl">
            {/* Circular Progress Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" className="text-slate-800" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-emerald-400 transition-all duration-300"
                  strokeDasharray="175.9"
                  strokeDashoffset={circleOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white leading-none">{currentReps}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {exerciseNames[exercise]}
              </div>
              <div className="text-sm font-bold text-slate-200">
                <span>{currentReps}</span> / <span className="text-emerald-400">{targetReps}</span> ta
              </div>
              <div className="text-[11px] text-cyan-400 flex items-center space-x-1 mt-0.5">
                <i className="fa-solid fa-fire text-amber-500"></i>
                <span>{caloriesBurned} kcal</span>
              </div>
            </div>

            {/* Pose State Bar */}
            <div className="hidden sm:block border-l border-slate-800 pl-4 text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tana Holati</div>
              <div className={`text-xs font-bold mt-0.5 ${poseState.color}`}>
                {poseState.text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Helper Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm shrink-0">
            <i className="fa-solid fa-street-view"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">1. Masofani To'g'rilang</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Telefonni polga yoki stolga qo'yib, kamida 2 metr masofaga uzoqlashing.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm shrink-0">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">2. Haqiqiy Bo'g'in Boshqaruvi</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Tirsak yoki tizzangizni 90° gacha bukmaguncha va qayta yozmaguncha sanamaydi.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm shrink-0">
            <i className="fa-solid fa-award"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">3. Ball va XP Yig'ing</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Har 1 ta toza takrorlash uchun +10 XP beriladi va reytingingiz ko'tariladi.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
