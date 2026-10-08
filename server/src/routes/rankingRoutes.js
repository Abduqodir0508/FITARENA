import express from 'express';

const router = express.Router();

let leaderboardData = [
  { rank: 1, name: "Jasur_Fit", region: "Toshkent", duels: "24 / 28", reps: 1120, badge: "Olmos" },
  { rank: 2, name: "Bekzod_99", region: "Samarqand", duels: "19 / 22", reps: 840, badge: "Olmos" },
  { rank: 3, name: "Umid_Vorkaut", region: "Farg'ona", duels: "17 / 20", reps: 760, badge: "Oltin" },
  { rank: 4, name: "Sherzod_Tashkent", region: "Toshkent", duels: "14 / 18", reps: 690, badge: "Oltin" },
  { rank: 5, name: "Anvar_Buxoro", region: "Buxoro", duels: "12 / 15", reps: 620, badge: "Kumush" },
  { rank: 6, name: "Doston_Andijon", region: "Andijon", duels: "11 / 14", reps: 580, badge: "Kumush" },
  { rank: 7, name: "Xurshid_Xorazm", region: "Xorazm", duels: "9 / 12", reps: 510, badge: "Bronza" },
  { rank: 8, name: "Sardor_Qashqadaryo", region: "Qashqadaryo", duels: "8 / 11", reps: 490, badge: "Bronza" }
];

// GET /api/rankings - Get all or region filtered rankings
router.get('/', (req, res) => {
  const { region } = req.query;

  if (!region || region === 'all') {
    return res.json({
      success: true,
      region: 'all',
      total: leaderboardData.length,
      rankings: leaderboardData,
    });
  }

  const filtered = leaderboardData.filter(
    (item) => item.region.toLowerCase() === region.trim().toLowerCase()
  );

  res.json({
    success: true,
    region,
    total: filtered.length,
    rankings: filtered,
  });
});

// POST /api/rankings/score - Submit or update score
router.post('/score', (req, res) => {
  const { name, region, reps, duels, badge } = req.body;
  if (!name || !region || reps === undefined) {
    return res.status(400).json({
      success: false,
      message: "Ism, viloyat va takrorlashlar soni talab qilinadi",
    });
  }

  const existingIndex = leaderboardData.findIndex(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex !== -1) {
    leaderboardData[existingIndex].reps += Number(reps);
    leaderboardData[existingIndex].region = region || leaderboardData[existingIndex].region;
  } else {
    leaderboardData.push({
      rank: leaderboardData.length + 1,
      name,
      region,
      duels: duels || "1 / 1",
      reps: Number(reps),
      badge: badge || "Bronza",
    });
  }

  // Re-sort and re-rank
  leaderboardData.sort((a, b) => b.reps - a.reps);
  leaderboardData = leaderboardData.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  res.json({
    success: true,
    message: "Natija muvaffaqiyatli saqlandi",
    rankings: leaderboardData,
  });
});

export default router;
