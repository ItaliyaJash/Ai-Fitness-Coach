import { Router } from 'express';
import { Profile, Workout, PersonalRecord, BodyStat } from './models.js';

const router = Router();

// Helper to handle async error wraps
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Profile Routing
router.get('/profile', asyncHandler(async (req, res) => {
  let profile = await Profile.findOne({ order: [['id', 'ASC']] });
  if (!profile) {
    profile = await Profile.create({
      name: 'Athlete',
      fitnessLevel: 'intermediate',
      goals: ['muscle'],
      preferredEquipment: ['bodyweight', 'dumbbells'],
      units: 'kg'
    });
  }
  res.json(profile);
}));

router.post('/profile', asyncHandler(async (req, res) => {
  const { name, fitnessLevel, goals, preferredEquipment, units } = req.body;
  let profile = await Profile.findOne({ order: [['id', 'ASC']] });
  
  if (profile) {
    await profile.update({ name, fitnessLevel, goals, preferredEquipment, units });
  } else {
    profile = await Profile.create({ name, fitnessLevel, goals, preferredEquipment, units });
  }
  res.json(profile);
}));

// 2. Workout History Routing
router.get('/workouts', asyncHandler(async (req, res) => {
  const list = await Workout.findAll({ order: [['completedAt', 'DESC']] });
  res.json(list);
}));

router.post('/workouts', asyncHandler(async (req, res) => {
  const { id, name, completedAt, duration, totalVolume, completedExercises, muscleGroups, emoji } = req.body;
  const entry = await Workout.upsert({
    id, name, completedAt, duration, totalVolume, completedExercises, muscleGroups, emoji
  });
  res.status(201).json(entry[0]);
}));

router.delete('/workouts/:id', asyncHandler(async (req, res) => {
  const count = await Workout.destroy({ where: { id: req.params.id } });
  if (count > 0) {
    res.json({ success: true, message: 'Workout deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Workout not found' });
  }
}));

// 3. Personal Records Routing
router.get('/prs', asyncHandler(async (req, res) => {
  const list = await PersonalRecord.findAll();
  const map = {};
  list.forEach(r => {
    map[r.exerciseId] = { weight: r.weight, reps: r.reps, date: r.date };
  });
  res.json(map);
}));

router.post('/prs', asyncHandler(async (req, res) => {
  const { exerciseId, weight, reps, date } = req.body;
  
  // Custom logic: check if the new record is better than the existing
  const current = await PersonalRecord.findByPk(exerciseId);
  
  if (!current || weight > current.weight || (weight === current.weight && reps > current.reps)) {
    const entry = await PersonalRecord.upsert({
      exerciseId, weight, reps, date: date || new Date().toISOString()
    });
    return res.json({ isNew: true, record: entry[0] });
  }
  
  res.json({ isNew: false, record: current });
}));

// 4. Body Stats Routing
router.get('/bodystats', asyncHandler(async (req, res) => {
  const list = await BodyStat.findAll({ order: [['date', 'ASC']] });
  res.json(list);
}));

router.post('/bodystats', asyncHandler(async (req, res) => {
  const { id, weight, date } = req.body;
  const entry = await BodyStat.create({
    id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    weight,
    date: date || new Date().toISOString()
  });
  res.status(201).json(entry);
}));

// Bulk Data Management
router.post('/data/import', asyncHandler(async (req, res) => {
  const { profile, workouts, personalRecords, bodyStats } = req.body;

  if (profile) {
    let p = await Profile.findOne({ order: [['id', 'ASC']] });
    if (p) await p.update(profile);
    else await Profile.create(profile);
  }

  if (workouts && Array.isArray(workouts)) {
    await Workout.destroy({ where: {} });
    await Workout.bulkCreate(workouts);
  }

  if (personalRecords && typeof personalRecords === 'object') {
    await PersonalRecord.destroy({ where: {} });
    const prEntries = Object.entries(personalRecords).map(([exId, r]) => ({
      exerciseId: exId,
      weight: r.weight,
      reps: r.reps,
      date: r.date
    }));
    await PersonalRecord.bulkCreate(prEntries);
  }

  if (bodyStats && Array.isArray(bodyStats)) {
    await BodyStat.destroy({ where: {} });
    await BodyStat.bulkCreate(bodyStats);
  }

  res.json({ success: true, message: 'All data restored successfully' });
}));

export default router;
