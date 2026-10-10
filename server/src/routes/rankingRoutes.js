import express from 'express';
import {
  getLeaderboard,
  saveOrUpdateUser,
  addExpToUser,
  readUsers,
} from '../db/usersDb.js';

const router = express.Router();

/**
 * GET /api/rankings
 * Qat'iy bazadagi haqiqiy foydalanuvchilar ro'yxati (mock datalar yo'q)
 * ORDER BY exp DESC, faqat TOP-20 qaytariladi.
 */
router.get('/', (req, res) => {
  try {
    const { region = 'all', userId } = req.query;
    const leaderboard = getLeaderboard(region, userId);

    res.json({
      success: true,
      region,
      total: leaderboard.top20.length,
      totalUsersInDb: leaderboard.totalUsers,
      rankings: leaderboard.top20,
      currentUserRankInfo: leaderboard.currentUserRankInfo,
    });
  } catch (err) {
    console.error('[rankingRoutes] Xatolik:', err);
    res.status(500).json({
      success: false,
      message: 'Reytingni yuklashda server xatoligi yuz berdi',
    });
  }
});

/**
 * POST /api/rankings/user
 * Yangi foydalanuvchini ro'yxatdan o'tkazish yoki profilini yangilash
 * Boshlang'ich daraja: 0, EXP: 0
 */
router.post('/user', (req, res) => {
  try {
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi ma\'lumotlari to\'liq emas',
      });
    }

    const savedUser = saveOrUpdateUser(userData);
    res.json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli saqlandi',
      user: savedUser,
    });
  } catch (err) {
    console.error('[rankingRoutes] Foydalanuvchi saqlashda xatolik:', err);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchini saqlashda server xatoligi yuz berdi',
    });
  }
});

/**
 * POST /api/rankings/add-exp
 * Mashq (otjimaniya, turnik) yoki 1v1 duel yakunlanganda EXP ni hisobga qo'shish
 */
router.post('/add-exp', (req, res) => {
  try {
    const { userId, amount, repsDelta = 0, duelWon = null } = req.body;
    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi ID va EXP miqdori talab qilinadi',
      });
    }

    const updatedUser = addExpToUser(userId, Number(amount), Number(repsDelta), duelWon);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi bazada topilmadi',
      });
    }

    res.json({
      success: true,
      message: `${amount} EXP muvaffaqiyatli hisobga qo'shildi`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[rankingRoutes] EXP qo\'shishda xatolik:', err);
    res.status(500).json({
      success: false,
      message: 'EXP qo\'shishda server xatoligi yuz berdi',
    });
  }
});

/**
 * POST /api/rankings/score
 * Natijani yangilash (moslashuvchanlik uchun)
 */
router.post('/score', (req, res) => {
  try {
    const { id, name, region, reps, exp, badge } = req.body;
    if (!id && !name) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi ma\'lumotlari kiritilmadi',
      });
    }

    const userId = id || `user_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const user = saveOrUpdateUser({
      id: userId,
      fullName: name,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ')[1] || '',
      region: region || 'Toshkent shahri',
      xp: exp !== undefined ? Number(exp) : undefined,
      totalReps: Number(reps) || 0,
      badge,
    });

    res.json({
      success: true,
      message: 'Natija muvaffaqiyatli saqlandi',
      user,
    });
  } catch (err) {
    console.error('[rankingRoutes] Score yangilashda xatolik:', err);
    res.status(500).json({
      success: false,
      message: 'Natijani saqlashda server xatoligi',
    });
  }
});

export default router;
