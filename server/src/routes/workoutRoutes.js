import express from 'express';

const router = express.Router();

export const splitTemplates = {
  2: [
    {
      day: "1-Kun (Seshanba)",
      title: "Yuqori Tana (Ko'krak, Yelka, Triceps)",
      icon: "fa-person-burst",
      exercises: [
        { name: "Otjimaniya (Push-ups)", sets: "4 set x 12-15 ta", tip: "Ko'krak mushaklarini his qilib tushing" },
        { name: "Gantel bilan press (Bench Press)", sets: "3 set x 10 ta", tip: "Tirsaklarni 90 darajada ushlang" },
        { name: "Yelka uchun gantel ko'tarish", sets: "3 set x 12 ta", tip: "Gavdani tebratmasdan bajaring" }
      ]
    },
    {
      day: "2-Kun (Payshanba)",
      title: "Quyi Tana va Press (Oyoq, Bel, Press)",
      icon: "fa-dumbbell",
      exercises: [
        { name: "Prisedaniya (Squats)", sets: "4 set x 15 ta", tip: "Tizzalar oyoq uchidan o'tib ketmasin" },
        { name: "Press (Crunches)", sets: "3 set x 20 ta", tip: "Bo'yinni tortmang, qorinni qising" },
        { name: "Planka", sets: "3 set x 45 soniya", tip: "Belni pastga osiltirmang" }
      ]
    }
  ],
  3: [
    {
      day: "1-Kun (Dushanba)",
      title: "Ko'krak (Gruz) + Triceps",
      icon: "fa-person-burst",
      exercises: [
        { name: "Zalda shtanga bilan press", sets: "4 set x 10-12 ta", tip: "Novichoklar yengil vazndan boshlasin" },
        { name: "Otjimaniya (Push-ups)", sets: "3 set x 15 ta", tip: "Tana tekis taxtadek turishi shart" },
        { name: "Fransuzcha press (Triceps)", sets: "3 set x 12 ta", tip: "Tirsaklarni qimirlatmang" }
      ]
    },
    {
      day: "2-Kun (Chorshanba)",
      title: "Orqa (Bel/Krilolar) + Biceps",
      icon: "fa-hand-back-fist",
      exercises: [
        { name: "Turnikda tortilish (Pull-ups)", sets: "4 set x 8-10 ta", tip: "Orqa qanotlar bilan torting" },
        { name: "Shtanga gantel tortish (Row)", sets: "3 set x 12 ta", tip: "Belni bukmasdan bajaring" },
        { name: "Biceps uchun shtanga ko'tarish", sets: "3 set x 12 ta", tip: "To'liq amplituda" }
      ]
    },
    {
      day: "3-Kun (Juma)",
      title: "Oyoqlar + Yelkalar + Qorin Press",
      icon: "fa-bolt-lightning",
      exercises: [
        { name: "Shtanga bilan prisedaniya", sets: "4 set x 12 ta", tip: "Tovonga og'irlik bering" },
        { name: "Armeyskiy press (Yelka)", sets: "3 set x 10 ta", tip: "Nafasni to'g'ri oling" },
        { name: "Press uchun oyoq ko'tarish", sets: "4 set x 15 ta", tip: "Pastki qorin mushaklarini taranglang" }
      ]
    }
  ],
  4: [
    {
      day: "1-Kun",
      title: "Ko'krak va Biceps",
      icon: "fa-person-burst",
      exercises: [
        { name: "Gantel press", sets: "4 set x 12 ta", tip: "Ko'krakni keng oching" },
        { name: "Biceps gantel", sets: "3 set x 12 ta", tip: "Qo'lni to'liq buking" }
      ]
    },
    {
      day: "2-Kun",
      title: "Orqa va Triceps",
      icon: "fa-hand-back-fist",
      exercises: [
        { name: "Turnik tortilish", sets: "4 set x 10 ta", tip: "Keng ushlash" },
        { name: "Brusda otjimaniya", sets: "3 set x 10 ta", tip: "Tricepsga yuklama" }
      ]
    },
    {
      day: "3-Kun",
      title: "Dam Olish / Kardio",
      icon: "fa-heart-pulse",
      exercises: [
        { name: "Tez yurish / Yugurish", sets: "30 daqiqa", tip: "Puls 130-140 atrofida" }
      ]
    },
    {
      day: "4-Kun",
      title: "Oyoq va Yelkalar",
      icon: "fa-dumbbell",
      exercises: [
        { name: "Squats prisedaniya", sets: "4 set x 15 ta", tip: "Oyoq mushaklarini qizdiring" },
        { name: "Yelka mahoviy gantel", sets: "4 set x 12 ta", tip: "Tekis harakat" }
      ]
    }
  ],
  5: [
    {
      day: "1-Kun",
      title: "Ko'krak (Chest Day)",
      icon: "fa-person-burst",
      exercises: [
        { name: "Shtanga Press", sets: "4 x 10", tip: "Og'ir vazn" },
        { name: "Naklon gantel", sets: "3 x 12", tip: "Yuqori ko'krak" }
      ]
    },
    {
      day: "2-Kun",
      title: "Orqa (Back Day)",
      icon: "fa-hand-back-fist",
      exercises: [
        { name: "Turnik", sets: "4 x 10", tip: "Toza texnika" },
        { name: "Stanovaya tyaga", sets: "3 x 8", tip: "Bel kamari bilan" }
      ]
    },
    {
      day: "3-Kun",
      title: "Yelkalar va Press",
      icon: "fa-shield-halved",
      exercises: [
        { name: "Harbiy press", sets: "4 x 10", tip: "Yelka oldi" },
        { name: "Press plank", sets: "3 x 1 min", tip: "Qorin kuchi" }
      ]
    },
    {
      day: "4-Kun",
      title: "Oyoqlar (Leg Day)",
      icon: "fa-dumbbell",
      exercises: [
        { name: "Prisedaniya", sets: "4 x 12", tip: "Chuqur o'tiring" },
        { name: "Ikrlar ko'tarish", sets: "4 x 15", tip: "Tovonni ko'taring" }
      ]
    },
    {
      day: "5-Kun",
      title: "Qo'llar (Biceps + Triceps)",
      icon: "fa-hand-fist",
      exercises: [
        { name: "Super-set Biceps/Triceps", sets: "4 x 12", tip: "Qon haydash" }
      ]
    }
  ],
  6: [
    {
      day: "1-Kun",
      title: "Push A: Ko'krak + Yelka",
      icon: "fa-fire",
      exercises: [{ name: "Bench press", sets: "4 x 10", tip: "Ko'krak" }]
    },
    {
      day: "2-Kun",
      title: "Pull A: Orqa + Biceps",
      icon: "fa-hand-back-fist",
      exercises: [{ name: "Turnik", sets: "4 x 10", tip: "Keng orqa" }]
    },
    {
      day: "3-Kun",
      title: "Legs A: Kvadriseps + Press",
      icon: "fa-dumbbell",
      exercises: [{ name: "Squats", sets: "4 x 12", tip: "Oyoq kuchi" }]
    },
    {
      day: "4-Kun",
      title: "Push B: Triceps + Yuqori Ko'krak",
      icon: "fa-fire",
      exercises: [{ name: "Otjimaniya", sets: "4 x 20", tip: "Portlovchi kuch" }]
    },
    {
      day: "5-Kun",
      title: "Pull B: Krilolar + Trapeziya",
      icon: "fa-hand-back-fist",
      exercises: [{ name: "Gantel tyaga", sets: "4 x 12", tip: "Bel tekis" }]
    },
    {
      day: "6-Kun",
      title: "Legs B: Biceps bedra + Kardio",
      icon: "fa-heart-pulse",
      exercises: [{ name: "Vipadi qadamlar", sets: "3 x 15", tip: "Muvozanat" }]
    }
  ],
  7: [
    {
      day: "1-Kun",
      title: "Ko'krak Kuchi",
      icon: "fa-dumbbell",
      exercises: [{ name: "Shtanga Press", sets: "4 x 8", tip: "Og'ir" }]
    },
    {
      day: "2-Kun",
      title: "Orqa Kuchi",
      icon: "fa-hand-back-fist",
      exercises: [{ name: "Turnik tortilish", sets: "4 x 8", tip: "Toza" }]
    },
    {
      day: "3-Kun",
      title: "Oyoq Kuchi",
      icon: "fa-person-burst",
      exercises: [{ name: "Squats", sets: "4 x 10", tip: "Chuqur" }]
    },
    {
      day: "4-Kun",
      title: "Yelkalar",
      icon: "fa-shield-halved",
      exercises: [{ name: "Gantel mahoviy", sets: "4 x 12", tip: "Keng yelkalar" }]
    },
    {
      day: "5-Kun",
      title: "Qo'llar (Arm Day)",
      icon: "fa-hand-fist",
      exercises: [{ name: "Biceps + Triceps", sets: "4 x 12", tip: "Pump" }]
    },
    {
      day: "6-Kun",
      title: "Core & Press",
      icon: "fa-fire",
      exercises: [{ name: "Press kompleks", sets: "4 x 20", tip: "Qorin kubiklari" }]
    },
    {
      day: "7-Kun",
      title: "Aktiv Tiklanish & Kardio",
      icon: "fa-heart-pulse",
      exercises: [{ name: "Suzish / Yengil Yugurish", sets: "40 min", tip: "Kam yuklama" }]
    }
  ]
};

// GET /api/plans - Get all split plans
router.get('/', (req, res) => {
  res.json({
    success: true,
    availableDays: [2, 3, 4, 5, 6, 7],
    plans: splitTemplates,
  });
});

// GET /api/plans/:days - Get plan for specific number of days (2-7)
router.get('/:days', (req, res) => {
  const days = parseInt(req.params.days, 10);
  if (!days || days < 2 || days > 7) {
    return res.status(400).json({
      success: false,
      message: "Kunlar soni 2 dan 7 gacha bo'lishi kerak (e.g. /api/plans/3)",
    });
  }

  const plan = splitTemplates[days];
  res.json({
    success: true,
    days,
    plan,
  });
});

export default router;
