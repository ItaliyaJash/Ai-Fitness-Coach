import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Dumbbell, Target, Timer, ChevronRight, Flame, RotateCcw } from 'lucide-react';
import { generateWorkout } from '../utils/workoutEngine';
import { getProfile } from '../utils/storage';
import { muscleGroups, equipmentTypes, muscleGroupEmoji, equipmentEmoji } from '../data/exercises';

function WorkoutGenerator() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('muscle'); // 'muscle', 'fat_loss', 'endurance', 'flexibility'
  const [selectedMuscles, setSelectedMuscles] = useState(['chest', 'back']);
  const [selectedEquipment, setSelectedEquipment] = useState(['dumbbells', 'bodyweight']);
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load preferences from profile on mount
  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      if (profile.goals && profile.goals.length > 0) {
        setGoal(profile.goals[0]);
      }
      if (profile.preferredEquipment && profile.preferredEquipment.length > 0) {
        setSelectedEquipment(profile.preferredEquipment);
      }
      if (profile.fitnessLevel) {
        setDifficulty(profile.fitnessLevel);
      }
    }
  }, []);

  const toggleMuscle = (muscle) => {
    if (selectedMuscles.includes(muscle)) {
      if (selectedMuscles.length > 1) {
        setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
      }
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const toggleEquipment = (equip) => {
    if (selectedEquipment.includes(equip)) {
      if (selectedEquipment.length > 1) {
        setSelectedEquipment(selectedEquipment.filter(e => e !== equip));
      }
    } else {
      setSelectedEquipment([...selectedEquipment, equip]);
    }
  };

  const selectAllMuscles = () => {
    setSelectedMuscles([...muscleGroups]);
  };

  const selectAllEquipment = () => {
    setSelectedEquipment([...equipmentTypes]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const config = {
        muscleGroups: selectedMuscles,
        equipment: selectedEquipment,
        duration,
        difficulty,
        goal
      };
      const workout = generateWorkout(config);
      localStorage.setItem('fitcoach_current_workout', JSON.stringify(workout));
      setIsGenerating(false);
      navigate(`/workout/${workout.id}`);
    }, 1500);
  };

  const goals = [
    { id: 'muscle', label: 'Build Muscle', emoji: '💪', desc: 'Focus on hypertrophy & strength' },
    { id: 'fat_loss', label: 'Burn Fat', emoji: '🔥', desc: 'High intensity cardio & volume' },
    { id: 'endurance', label: 'Endurance', emoji: '🫀', desc: 'Stamina & aerobic capacity' },
    { id: 'flexibility', label: 'Flexibility', emoji: '🧘', desc: 'Mobility, balance & stretch' }
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Generate <span className="gradient-text-energy">Workout</span></h1>
      <p className="page-subtitle">Customize your perfect training session</p>

      {/* 1. Goal Selection */}
      <div className="section-header">
        <span className="section-title">1. Select Your Goal</span>
      </div>
      <div className="goal-grid mb-lg">
        {goals.map(g => (
          <div
            key={g.id}
            className={`goal-card ${goal === g.id ? 'active' : ''}`}
            onClick={() => setGoal(g.id)}
          >
            <span className="goal-card-icon">{g.emoji}</span>
            <span className="goal-card-title">{g.label}</span>
            <span className="goal-card-desc">{g.desc}</span>
          </div>
        ))}
      </div>

      {/* 2. Muscle Group Selector */}
      <div className="section-header">
        <span className="section-title">2. Target Muscle Groups</span>
        <button className="btn btn-ghost btn-sm" onClick={selectAllMuscles}>Select All</button>
      </div>
      <div className="chip-group mb-lg">
        {muscleGroups.map(m => (
          <button
            key={m}
            className={`chip chip-purple ${selectedMuscles.includes(m) ? 'active' : ''}`}
            onClick={() => toggleMuscle(m)}
          >
            {muscleGroupEmoji[m] || '💪'} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* 3. Equipment Selector */}
      <div className="section-header">
        <span className="section-title">3. Available Equipment</span>
        <button className="btn btn-ghost btn-sm" onClick={selectAllEquipment}>Select All</button>
      </div>
      <div className="chip-group mb-lg">
        {equipmentTypes.map(e => (
          <button
            key={e}
            className={`chip chip-orange ${selectedEquipment.includes(e) ? 'active' : ''}`}
            onClick={() => toggleEquipment(e)}
          >
            {equipmentEmoji[e] || '🏋️'} {e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      {/* 4. Duration Slider */}
      <div className="section-header">
        <span className="section-title">4. Workout Duration</span>
        <span className="section-subtitle font-bold text-accent">{duration} Minutes</span>
      </div>
      <div className="glass-card mb-lg">
        <div className="flex items-center gap-md mb-sm">
          <Timer className="text-tertiary" size={20} />
          <input
            type="range"
            min="15"
            max="90"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="range-slider"
            style={{ flex: 1 }}
          />
        </div>
        <div className="flex justify-between text-xs text-tertiary">
          <span>15 min</span>
          <span>45 min</span>
          <span>90 min</span>
        </div>
      </div>

      {/* 5. Difficulty Level */}
      <div className="section-header">
        <span className="section-title">5. Difficulty Level</span>
      </div>
      <div className="chip-group mb-xl">
        {['beginner', 'intermediate', 'advanced'].map(level => (
          <button
            key={level}
            className={`chip chip-green ${difficulty === level ? 'active' : ''}`}
            onClick={() => setDifficulty(level)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* 6. Generate Action */}
      <button
        className="btn btn-primary btn-lg btn-block"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ minHeight: '56px' }}
      >
        {isGenerating ? (
          <>
            <div className="spinner" style={{ marginRight: '8px' }}></div> Generating Plan...
          </>
        ) : (
          <>
            Generate AI Workout <Zap size={18} />
          </>
        )}
      </button>
    </div>
  );
}

export default WorkoutGenerator;
