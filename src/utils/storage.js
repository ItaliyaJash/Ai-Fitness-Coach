const STORAGE_PREFIX = 'fitcoach_';
const API_BASE = 'http://localhost:5000/api';

const KEYS = {
  PROFILE: `${STORAGE_PREFIX}profile`,
  WORKOUTS: `${STORAGE_PREFIX}workouts`,
  PERSONAL_RECORDS: `${STORAGE_PREFIX}personal_records`,
  BODY_STATS: `${STORAGE_PREFIX}body_stats`,
};

const DEFAULT_PROFILE = {
  name: 'Athlete',
  fitnessLevel: 'intermediate',
  goals: ['muscle'],
  preferredEquipment: ['bodyweight', 'dumbbells'],
  units: 'kg',
  createdAt: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error(`[storage] Failed to write key "${key}"`);
    return false;
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Server Sync Helpers (Fire-and-forget background sync)
// ---------------------------------------------------------------------------

async function postToServer(path, body, method = 'POST') {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok;
  } catch (err) {
    console.log(`[Sync] Offline / server offline. Failed to sync ${path}:`, err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Synchronize Database -> LocalStorage on App Startup
// ---------------------------------------------------------------------------

export async function syncWithBackend() {
  try {
    console.log('[Sync] Synchronizing SQLite database with local storage...');
    
    // 1. Sync Profile
    const profileRes = await fetch(`${API_BASE}/profile`);
    if (profileRes.ok) {
      const serverProfile = await profileRes.json();
      writeJSON(KEYS.PROFILE, serverProfile);
    }

    // 2. Sync Workouts
    const workoutsRes = await fetch(`${API_BASE}/workouts`);
    if (workoutsRes.ok) {
      const serverWorkouts = await workoutsRes.json();
      writeJSON(KEYS.WORKOUTS, serverWorkouts);
    }

    // 3. Sync Personal Records
    const prsRes = await fetch(`${API_BASE}/prs`);
    if (prsRes.ok) {
      const serverPRs = await prsRes.json();
      writeJSON(KEYS.PERSONAL_RECORDS, serverPRs);
    }

    // 4. Sync Body Stats
    const statsRes = await fetch(`${API_BASE}/bodystats`);
    if (statsRes.ok) {
      const serverStats = await statsRes.json();
      writeJSON(KEYS.BODY_STATS, serverStats);
    }

    console.log('[Sync] All local cached data synced from SQLite backend.');
    return true;
  } catch (err) {
    console.log('[Sync] Backend offline, continuing in local offline-only mode.');
    return false;
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function getProfile() {
  try {
    const profile = readJSON(KEYS.PROFILE);
    if (profile) return profile;
    const fresh = { ...DEFAULT_PROFILE, createdAt: new Date().toISOString() };
    writeJSON(KEYS.PROFILE, fresh);
    // Sync creation to server
    postToServer('/profile', fresh);
    return fresh;
  } catch {
    return { ...DEFAULT_PROFILE, createdAt: new Date().toISOString() };
  }
}

export function saveProfile(profile) {
  try {
    const existing = getProfile();
    const merged = { ...existing, ...profile, updatedAt: new Date().toISOString() };
    writeJSON(KEYS.PROFILE, merged);
    // Push sync
    postToServer('/profile', merged);
    return merged;
  } catch {
    console.error('[storage] Failed to save profile');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Workout History
// ---------------------------------------------------------------------------

export function getWorkoutHistory() {
  try {
    return readJSON(KEYS.WORKOUTS, []);
  } catch {
    return [];
  }
}

export function saveWorkout(workout) {
  try {
    const history = getWorkoutHistory();
    const entry = {
      ...workout,
      id: workout.id || generateId(),
      completedAt: workout.completedAt || new Date().toISOString(),
    };
    history.push(entry);
    writeJSON(KEYS.WORKOUTS, history);
    // Push sync
    postToServer('/workouts', entry);
    return entry;
  } catch {
    console.error('[storage] Failed to save workout');
    return null;
  }
}

export function deleteWorkout(id) {
  try {
    const history = getWorkoutHistory();
    const filtered = history.filter((w) => w.id !== id);
    if (filtered.length === history.length) return false;
    writeJSON(KEYS.WORKOUTS, filtered);
    // Push sync
    postToServer(`/workouts/${id}`, null, 'DELETE');
    return true;
  } catch {
    console.error('[storage] Failed to delete workout');
    return false;
  }
}

// ---------------------------------------------------------------------------
// Personal Records
// ---------------------------------------------------------------------------

export function getPersonalRecords() {
  try {
    return readJSON(KEYS.PERSONAL_RECORDS, {});
  } catch {
    return {};
  }
}

export function updatePersonalRecord(exerciseId, weight, reps) {
  try {
    const records = getPersonalRecords();
    const current = records[exerciseId];
    const newRecord = { weight, reps, date: new Date().toISOString() };

    if (
      !current ||
      weight > current.weight ||
      (weight === current.weight && reps > current.reps)
    ) {
      records[exerciseId] = newRecord;
      writeJSON(KEYS.PERSONAL_RECORDS, records);
      // Push sync
      postToServer('/prs', { exerciseId, weight, reps, date: newRecord.date });
      return { isNew: true, record: newRecord, previous: current || null };
    }

    return { isNew: false, record: current, previous: current };
  } catch {
    console.error('[storage] Failed to update personal record');
    return { isNew: false, record: null, previous: null };
  }
}

// ---------------------------------------------------------------------------
// Body Stats
// ---------------------------------------------------------------------------

export function getBodyStats() {
  try {
    return readJSON(KEYS.BODY_STATS, []);
  } catch {
    return [];
  }
}

export function saveBodyStat(stat) {
  try {
    const stats = getBodyStats();
    const entry = {
      ...stat,
      id: stat.id || generateId(),
      date: stat.date || new Date().toISOString(),
    };
    stats.push(entry);
    stats.sort((a, b) => new Date(a.date) - new Date(b.date));
    writeJSON(KEYS.BODY_STATS, stats);
    // Push sync
    postToServer('/bodystats', entry);
    return entry;
  } catch {
    console.error('[storage] Failed to save body stat');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Streak Calculation
// ---------------------------------------------------------------------------

export function getStreakData() {
  try {
    const history = getWorkoutHistory();
    if (history.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, lastWorkoutDate: null };
    }

    const workoutDates = new Set(
      history.map((w) => {
        const d = new Date(w.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    const sortedDates = Array.from(workoutDates).sort();

    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let currentStreak = 0;
    let checkDate = new Date(todayStr);

    while (true) {
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (workoutDates.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (currentStreak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (workoutDates.has(yesterdayStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalWorkouts: history.length,
      lastWorkoutDate: sortedDates[sortedDates.length - 1],
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, lastWorkoutDate: null };
  }
}

// ---------------------------------------------------------------------------
// Data Import / Export / Reset
// ---------------------------------------------------------------------------

export function exportAllData() {
  try {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      workouts: getWorkoutHistory(),
      personalRecords: getPersonalRecords(),
      bodyStats: getBodyStats(),
    };
    return JSON.stringify(data, null, 2);
  } catch {
    console.error('[storage] Failed to export data');
    return null;
  }
}

export function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    if (data.profile) writeJSON(KEYS.PROFILE, data.profile);
    if (data.workouts) writeJSON(KEYS.WORKOUTS, data.workouts);
    if (data.personalRecords) writeJSON(KEYS.PERSONAL_RECORDS, data.personalRecords);
    if (data.bodyStats) writeJSON(KEYS.BODY_STATS, data.bodyStats);

    // Push bulk import to server
    postToServer('/data/import', data);

    return { success: true, message: 'Data imported successfully' };
  } catch (err) {
    console.error('[storage] Failed to import data:', err);
    return { success: false, message: err.message || 'Failed to parse import data' };
  }
}

export function resetAllData() {
  try {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    // Triggers server tables to clean
    postToServer('/data/import', { profile: {}, workouts: [], personalRecords: {}, bodyStats: [] });
    return true;
  } catch {
    console.error('[storage] Failed to reset data');
    return false;
  }
}
