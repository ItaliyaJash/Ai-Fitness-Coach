import exercises from '../data/exercises.js';

// ---------------------------------------------------------------------------
// Goal-based configuration
// ---------------------------------------------------------------------------

const GOAL_CONFIG = {
  muscle: {
    setsRange: [3, 4],
    repsRange: '8-12',
    restRange: [60, 90],
    compoundRatio: 0.6,
  },
  fat_loss: {
    setsRange: [3, 4],
    repsRange: '12-15',
    restRange: [30, 45],
    compoundRatio: 0.5,
  },
  endurance: {
    setsRange: [2, 3],
    repsRange: '15-20',
    restRange: [20, 30],
    compoundRatio: 0.4,
  },
  flexibility: {
    setsRange: [2, 3],
    repsRange: '30-60s',
    restRange: [20, 30],
    compoundRatio: 0.3,
  },
};

const DIFFICULTY_MODIFIERS = {
  beginner: {
    setsAdjust: -1,
    restMultiplier: 1.3,
    allowedDifficulties: ['beginner'],
    exerciseCountMultiplier: 0.8,
  },
  intermediate: {
    setsAdjust: 0,
    restMultiplier: 1.0,
    allowedDifficulties: ['beginner', 'intermediate'],
    exerciseCountMultiplier: 1.0,
  },
  advanced: {
    setsAdjust: 1,
    restMultiplier: 0.85,
    allowedDifficulties: ['beginner', 'intermediate', 'advanced'],
    exerciseCountMultiplier: 1.15,
  },
};

// ---------------------------------------------------------------------------
// Creative workout names
// ---------------------------------------------------------------------------

const NAME_PARTS = {
  chest: {
    nouns: ['Chest', 'Pec', 'Press'],
    adjectives: ['Iron', 'Power', 'Steel'],
  },
  back: {
    nouns: ['Back', 'Pull', 'Row'],
    adjectives: ['Iron', 'Titan', 'Strong'],
  },
  legs: {
    nouns: ['Leg', 'Squat', 'Lower Body'],
    adjectives: ['Thunder', 'Power', 'Iron'],
  },
  shoulders: {
    nouns: ['Shoulder', 'Delt', 'Boulder'],
    adjectives: ['Capped', 'Broad', 'Atlas'],
  },
  arms: {
    nouns: ['Arm', 'Gun', 'Flex'],
    adjectives: ['Peak', 'Sleeve-Busting', 'Iron'],
  },
  core: {
    nouns: ['Core', 'Ab', 'Midline'],
    adjectives: ['Steel', 'Solid', 'Granite'],
  },
};

const GOAL_SUFFIXES = {
  muscle: ['Builder', 'Blast', 'Overload', 'Hypertrophy', 'Pump', 'Gainz'],
  fat_loss: ['Burner', 'Torch', 'Shred', 'Inferno', 'Melt'],
  endurance: ['Endurance', 'Stamina', 'Marathon', 'Grind', 'Forge'],
  flexibility: ['Flow', 'Mobility', 'Stretch', 'Balance', 'Zen'],
};

const MULTI_GROUP_NAMES = {
  'chest,back': ['Push-Pull Powerhouse', 'Upper Body Assault', 'Front & Back Attack'],
  'chest,shoulders': ['Press Day Domination', 'Upper Push Power', 'Shoulder & Chest Smash'],
  'chest,arms': ['Push & Pump', 'Chest & Arms Express', 'Upper Body Sculpt'],
  'back,shoulders': ['Pull Day Fury', 'Yoke Builder', 'Upper Pull Power'],
  'back,arms': ['Pull & Curl Combo', 'Back & Bicep Blitz', 'Pulling Power'],
  'legs,core': ['Foundation Builder', 'Legs & Core Crusher', 'Pillar of Strength'],
  'shoulders,arms': ['Shoulder & Arm Annihilation', 'Upper Sculpt', 'Arms Race'],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWorkoutName(selectedMuscleGroups, goal) {
  const sorted = [...selectedMuscleGroups].sort();
  const key = sorted.join(',');

  // Check for predefined multi-group names
  if (sorted.length === 2 && MULTI_GROUP_NAMES[key]) {
    return pickRandom(MULTI_GROUP_NAMES[key]);
  }

  // Full body
  if (sorted.length >= 4) {
    const suffixes = GOAL_SUFFIXES[goal] || GOAL_SUFFIXES.muscle;
    return `Full Body ${pickRandom(suffixes)}`;
  }

  // Upper body combo
  const upperGroups = ['chest', 'back', 'shoulders', 'arms'];
  const lowerGroups = ['legs'];
  const isAllUpper = sorted.every((g) => upperGroups.includes(g));
  const isAllLower = sorted.every((g) => lowerGroups.includes(g) || g === 'core');

  if (sorted.length >= 2 && isAllUpper) {
    const suffixes = GOAL_SUFFIXES[goal] || GOAL_SUFFIXES.muscle;
    return `Upper Body ${pickRandom(suffixes)}`;
  }
  if (sorted.length >= 2 && isAllLower) {
    const suffixes = GOAL_SUFFIXES[goal] || GOAL_SUFFIXES.muscle;
    return `Lower Body ${pickRandom(suffixes)}`;
  }

  // Single muscle group
  if (sorted.length === 1) {
    const group = sorted[0];
    const parts = NAME_PARTS[group];
    const suffixes = GOAL_SUFFIXES[goal] || GOAL_SUFFIXES.muscle;
    return `${pickRandom(parts.adjectives)} ${pickRandom(parts.nouns)} ${pickRandom(suffixes)}`;
  }

  // Generic fallback for 3 groups
  const suffixes = GOAL_SUFFIXES[goal] || GOAL_SUFFIXES.muscle;
  const firstGroup = NAME_PARTS[sorted[0]];
  return `${pickRandom(firstGroup.adjectives)} ${pickRandom(suffixes)} Session`;
}

// ---------------------------------------------------------------------------
// Utility: Fisher-Yates shuffle
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

function isCompound(exercise) {
  return exercise.secondaryMuscles && exercise.secondaryMuscles.length >= 1;
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

export function generateWorkout({
  muscleGroups: selectedMuscleGroups = ['chest', 'back', 'legs'],
  equipment = ['bodyweight', 'dumbbells'],
  duration = 45,
  difficulty = 'intermediate',
  goal = 'muscle',
}) {
  const goalConfig = GOAL_CONFIG[goal] || GOAL_CONFIG.muscle;
  const diffMod = DIFFICULTY_MODIFIERS[difficulty] || DIFFICULTY_MODIFIERS.intermediate;

  // 1. Filter exercises by selected muscle groups AND equipment
  const pool = exercises.filter(
    (ex) =>
      selectedMuscleGroups.includes(ex.muscleGroup) &&
      equipment.includes(ex.equipment) &&
      diffMod.allowedDifficulties.includes(ex.difficulty)
  );

  if (pool.length === 0) {
    // Fallback: relax difficulty filter
    const relaxedPool = exercises.filter(
      (ex) =>
        selectedMuscleGroups.includes(ex.muscleGroup) &&
        equipment.includes(ex.equipment)
    );
    if (relaxedPool.length === 0) {
      return _buildEmptyWorkout(selectedMuscleGroups, goal, difficulty);
    }
    return _buildFromPool(relaxedPool, selectedMuscleGroups, duration, goal, goalConfig, diffMod, difficulty);
  }

  return _buildFromPool(pool, selectedMuscleGroups, duration, goal, goalConfig, diffMod, difficulty);
}

function _buildEmptyWorkout(selectedMuscleGroups, goal, difficulty) {
  return {
    id: `workout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Custom Workout',
    createdAt: new Date().toISOString(),
    goal,
    difficulty,
    estimatedDuration: 0,
    exercises: [],
  };
}

function _buildFromPool(pool, selectedMuscleGroups, duration, goal, goalConfig, diffMod, difficulty) {
  // 2. Calculate number of exercises based on duration
  const minutesPerExercise = goal === 'fat_loss' ? 5 : goal === 'endurance' ? 4.5 : 6;
  let targetCount = Math.round((duration / minutesPerExercise) * diffMod.exerciseCountMultiplier);
  targetCount = Math.max(3, Math.min(targetCount, pool.length));

  // 3. Separate into compound and isolation
  const compounds = pool.filter(isCompound);
  const isolations = pool.filter((ex) => !isCompound(ex));

  // 4. Balance across muscle groups
  const exercisesPerGroup = Math.max(1, Math.floor(targetCount / selectedMuscleGroups.length));
  const selected = [];
  const usedIds = new Set();

  // First pass: pick compound exercises for each group (prioritize them)
  for (const group of selectedMuscleGroups) {
    const groupCompounds = shuffle(compounds.filter((ex) => ex.muscleGroup === group));
    const compoundCount = Math.ceil(exercisesPerGroup * goalConfig.compoundRatio);

    for (let i = 0; i < compoundCount && i < groupCompounds.length; i++) {
      if (!usedIds.has(groupCompounds[i].id)) {
        selected.push(groupCompounds[i]);
        usedIds.add(groupCompounds[i].id);
      }
    }
  }

  // Second pass: fill remaining slots with isolation exercises
  for (const group of selectedMuscleGroups) {
    const groupIsolations = shuffle(isolations.filter((ex) => ex.muscleGroup === group));
    const currentGroupCount = selected.filter((ex) => ex.muscleGroup === group).length;
    const needed = exercisesPerGroup - currentGroupCount;

    for (let i = 0; i < needed && i < groupIsolations.length; i++) {
      if (!usedIds.has(groupIsolations[i].id)) {
        selected.push(groupIsolations[i]);
        usedIds.add(groupIsolations[i].id);
      }
    }
  }

  // Third pass: if we still need more exercises, add from any group
  if (selected.length < targetCount) {
    const remaining = shuffle(pool.filter((ex) => !usedIds.has(ex.id)));
    for (let i = 0; i < remaining.length && selected.length < targetCount; i++) {
      selected.push(remaining[i]);
      usedIds.add(remaining[i].id);
    }
  }

  // 5. Order: compounds first, then isolations — within each, group by muscle group
  const orderedCompounds = selected.filter(isCompound);
  const orderedIsolations = selected.filter((ex) => !isCompound(ex));

  // Sort each group so same muscle groups are together
  const sortByMuscle = (a, b) => {
    const aIdx = selectedMuscleGroups.indexOf(a.muscleGroup);
    const bIdx = selectedMuscleGroups.indexOf(b.muscleGroup);
    return aIdx - bIdx;
  };

  orderedCompounds.sort(sortByMuscle);
  orderedIsolations.sort(sortByMuscle);

  const finalOrder = [...orderedCompounds, ...orderedIsolations];

  // 6. Build the workout exercises with adjusted sets/reps/rest
  const workoutExercises = finalOrder.map((ex) => {
    const baseSets = randomInRange(goalConfig.setsRange[0], goalConfig.setsRange[1]);
    const adjustedSets = Math.max(1, baseSets + diffMod.setsAdjust);

    const baseRest = randomInRange(goalConfig.restRange[0], goalConfig.restRange[1]);
    const adjustedRest = Math.round(baseRest * diffMod.restMultiplier);

    // Use goal-specific reps, but honor exercise defaults for timed exercises
    const isTimedExercise = ex.defaultReps && ex.defaultReps.includes('s');
    const reps = isTimedExercise ? ex.defaultReps : goalConfig.repsRange;

    const notes = _generateNotes(ex, goal, difficulty);

    return {
      exerciseId: ex.id,
      name: ex.name,
      emoji: ex.emoji,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      sets: adjustedSets,
      reps,
      restSeconds: adjustedRest,
      notes,
    };
  });

  // 7. Estimate total duration
  const estimatedDuration = workoutExercises.reduce((total, ex) => {
    const repsPart = ex.reps.includes('s')
      ? parseInt(ex.reps, 10) || 30
      : 40; // rough seconds per set for rep-based
    const setTime = (repsPart + ex.restSeconds) * ex.sets;
    return total + setTime / 60;
  }, 0);

  // 8. Generate name
  const name = generateWorkoutName(selectedMuscleGroups, goal);

  return {
    id: `workout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    createdAt: new Date().toISOString(),
    goal,
    difficulty,
    estimatedDuration: Math.round(estimatedDuration),
    exercises: workoutExercises,
  };
}

// ---------------------------------------------------------------------------
// Smart notes generation
// ---------------------------------------------------------------------------

function _generateNotes(exercise, goal, difficulty) {
  const notes = [];

  if (difficulty === 'beginner') {
    notes.push('Focus on form over weight.');
    if (exercise.difficulty === 'beginner') {
      notes.push('Great exercise for building your foundation.');
    }
  }

  if (difficulty === 'advanced' && isCompound(exercise)) {
    notes.push('Push for progressive overload — add weight or reps each session.');
  }

  if (goal === 'muscle') {
    if (isCompound(exercise)) {
      notes.push('Use a challenging weight for the prescribed rep range.');
    } else {
      notes.push('Focus on the mind-muscle connection and controlled reps.');
    }
  } else if (goal === 'fat_loss') {
    notes.push('Keep rest periods short to maintain elevated heart rate.');
  } else if (goal === 'endurance') {
    notes.push('Use a lighter weight and focus on maintaining pace.');
  } else if (goal === 'flexibility') {
    notes.push('Focus on controlled movements through full range of motion.');
  }

  return notes.join(' ');
}

export default generateWorkout;
