import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../data/users.json');

// Ensure data directory and file exist
function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read all real users from persistent DB
export function readUsers() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[usersDb] Error reading users DB:', err);
    return [];
  }
}

// Write users to persistent DB
export function writeUsers(users) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[usersDb] Error writing users DB:', err);
  }
}

// Badge calculation based on EXP
export function calculateBadge(exp) {
  const numExp = Number(exp) || 0;
  if (numExp >= 2000) return 'Olmos';
  if (numExp >= 1000) return 'Oltin';
  if (numExp >= 500) return 'Kumush';
  if (numExp >= 200) return 'Bronza';
  return 'Boshlang\'ich';
}

// Level calculation based on EXP: Level 0 for 0-99 EXP, Level 1 for 100-199 EXP, etc.
export function calculateLevel(exp) {
  const numExp = Number(exp) || 0;
  return Math.floor(numExp / 100);
}

/**
 * Get Leaderboard:
 * - Real users only (no mock data)
 * - Sorted by EXP DESC (ORDER BY exp DESC)
 * - Top 20 players
 */
export function getLeaderboard(region = 'all', currentUserId = null) {
  const users = readUsers();

  // Filter by region if specified
  let filtered = users;
  if (region && region !== 'all') {
    const regLower = region.trim().toLowerCase();
    filtered = users.filter((u) => (u.region || '').toLowerCase().includes(regLower) || regLower.includes((u.region || '').toLowerCase()));
  }

  // Sort descending by EXP (ORDER BY exp DESC), secondary sort by totalReps DESC
  filtered.sort((a, b) => {
    const expDiff = (b.exp || 0) - (a.exp || 0);
    if (expDiff !== 0) return expDiff;
    return (b.totalReps || 0) - (a.totalReps || 0);
  });

  // Assign ranks across the entire filtered pool
  const rankedAll = filtered.map((user, idx) => ({
    ...user,
    rank: idx + 1,
    level: calculateLevel(user.exp),
    badge: user.badge || calculateBadge(user.exp),
  }));

  // Top 20 only
  const top20 = rankedAll.slice(0, 20);

  // Check current user status
  let currentUserRankInfo = null;
  if (currentUserId) {
    const userOverallIdx = rankedAll.findIndex((u) => u.id === currentUserId);
    if (userOverallIdx !== -1) {
      const userItem = rankedAll[userOverallIdx];
      const isInTop20 = userOverallIdx < 20;
      const expNeededForTop20 = !isInTop20 && top20.length === 20
        ? Math.max(0, (top20[19]?.exp || 0) - (userItem.exp || 0) + 1)
        : 0;

      currentUserRankInfo = {
        rank: userItem.rank,
        isInTop20,
        expNeededForTop20,
        totalPlayers: rankedAll.length,
      };
    }
  }

  return {
    top20,
    totalUsers: rankedAll.length,
    region,
    currentUserRankInfo,
  };
}

/**
 * Save or update a registered user in DB
 */
export function saveOrUpdateUser(userData) {
  if (!userData || !userData.id) {
    throw new Error('Foydalanuvchi ID talab qilinadi');
  }

  const users = readUsers();
  const existingIdx = users.findIndex((u) => u.id === userData.id);

  const initialExp = userData.xp !== undefined ? Number(userData.xp) : Number(userData.exp || 0);
  const userRecord = {
    id: userData.id,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    age: Number(userData.age) || 20,
    region: userData.region || 'Toshkent shahri',
    gender: userData.gender || 'male',
    exp: initialExp,
    level: calculateLevel(initialExp),
    totalReps: Number(userData.totalReps || 0),
    duelsWon: Number(userData.duelsWon || 0),
    duelsTotal: Number(userData.duelsTotal || 0),
    badge: calculateBadge(initialExp),
    registeredAt: userData.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    // Preserve existing exp if incoming is not higher, or update accordingly
    const existing = users[existingIdx];
    userRecord.exp = Math.max(existing.exp || 0, userRecord.exp);
    userRecord.level = calculateLevel(userRecord.exp);
    userRecord.badge = calculateBadge(userRecord.exp);
    userRecord.totalReps = Math.max(existing.totalReps || 0, userRecord.totalReps);
    userRecord.duelsWon = Math.max(existing.duelsWon || 0, userRecord.duelsWon);
    userRecord.duelsTotal = Math.max(existing.duelsTotal || 0, userRecord.duelsTotal);
    userRecord.registeredAt = existing.registeredAt || userRecord.registeredAt;
    users[existingIdx] = userRecord;
  } else {
    users.push(userRecord);
  }

  writeUsers(users);
  return userRecord;
}

/**
 * Add EXP directly to user profile and update reps/duels
 */
export function addExpToUser(userId, amount, repsDelta = 0, duelWon = null) {
  const users = readUsers();
  const userIdx = users.findIndex((u) => u.id === userId);

  if (userIdx === -1) {
    return null;
  }

  const user = users[userIdx];
  const newExp = (Number(user.exp) || 0) + Number(amount);
  user.exp = newExp;
  user.level = calculateLevel(newExp);
  user.badge = calculateBadge(newExp);

  if (repsDelta > 0) {
    user.totalReps = (Number(user.totalReps) || 0) + Number(repsDelta);
  }

  if (duelWon !== null) {
    user.duelsTotal = (Number(user.duelsTotal) || 0) + 1;
    if (duelWon) {
      user.duelsWon = (Number(user.duelsWon) || 0) + 1;
    }
  }

  user.updatedAt = new Date().toISOString();
  users[userIdx] = user;
  writeUsers(users);

  return user;
}
