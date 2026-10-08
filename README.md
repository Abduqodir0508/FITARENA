# FitArena AI — Full-Stack Real-time Sport & 1v1 PvP Duel Platform

FitArena AI monolit HTML arxitekturadan professional **Full-Stack (React + Tailwind CSS + Node.js + Express + Socket.io)** arxitekturaga to'liq ajratildi.

---

## 📁 Loyiha Tuzilishi (Folder Architecture)

```
fitarena-ai/
├── client/                      # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Yuqori panel (XP, daraja, audio toggle)
│   │   │   ├── TabsNav.jsx      # Sahifalar o'rtasida navigatsiya tugmalari
│   │   │   ├── tabs/
│   │   │   │   ├── CameraTab.jsx      # AI kamera, Canvas skelet vizualizatsiyasi va rep-counter
│   │   │   │   ├── DuelTab.jsx        # 1v1 real-time PvP maydoni va taymer
│   │   │   │   ├── PlanTab.jsx        # 2-7 kunlik zal/mashq rejasi generatori
│   │   │   │   ├── RankingTab.jsx     # Viloyatlar bo'yicha filterlanadigan reyting
│   │   │   │   └── GuideTab.jsx       # Boshlang'ich qo'llanma va qoidalar
│   │   │   ├── modals/
│   │   │   │   └── DuelResultModal.jsx# G'alaba / Mag'lubiyat modali
│   │   ├── utils/
│   │   │   ├── audioSynth.js          # Web Audio API (ovozlar va fanfaralar)
│   │   │   └── poseKinematics.js      # Skelet bo'g'inlari va burchak hisob-kitoblari
│   │   ├── data/
│   │   │   └── splitTemplates.js      # 2 dan 7 kungacha bo'lgan mashq rejalari
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── vite.config.js
│
└── server/                      # Node.js + Express.js backend
    ├── src/
    │   ├── routes/
    │   │   ├── workoutRoutes.js # Mashq rejalarini qaytaruvchi API
    │   │   └── rankingRoutes.js # O'zbekiston viloyatlari reytingi API
    │   ├── sockets/
    │   │   └── duelSocket.js    # 1v1 PvP real-time matchmaking va harakatlarni sinxronlash
    │   └── server.js            # Express server va Socket.io ulanishi
    ├── package.json
    └── .env
```

---

## 🚀 Ishga Tushirish (Quick Start Guide)

### 1. Backend Serverni Ishga Tushirish:
```bash
cd server
npm install
npm run dev
```
Server `http://localhost:5000` portida ishga tushadi.

### 2. Frontend Clientni Ishga Tushirish:
```bash
cd client
npm install
npm run dev
```
Frontend `http://localhost:5173` manzilida ochiladi.
