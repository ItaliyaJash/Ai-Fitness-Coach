import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Clock, Pause, Play, SkipForward, Trophy, X, Minus, Plus } from 'lucide-react';
import { saveWorkout, updatePersonalRecord } from '../utils/storage';

function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [setData, setSetData] = useState({}); // { exerciseIdx: [{ weight, reps, completed }] }
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [initialRestTime, setInitialRestTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [confetti, setConfetti] = useState([]);

  // Load workout on mount
  useEffect(() => {
    const saved = localStorage.getItem('fitcoach_current_workout');
    if (saved) {
      const w = JSON.parse(saved);
      if (w.id === id || !id) {
        setWorkout(w);
        // Initialize setData
        const initialData = {};
        w.exercises.forEach((ex, i) => {
          initialData[i] = Array.from({ length: ex.sets }, () => ({
            weight: ex.equipment === 'bodyweight' ? 0 : 10,
            reps: parseInt(ex.reps) || 10,
            completed: false
          }));
        });
        setSetData(initialData);
      }
    }
  }, [id]);

  // Audio tone for rest timer complete
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      setTimeout(() => osc.stop(), 300);
    } catch (e) {
      console.log('Audio Context blocked or not supported');
    }
  };

  // Rest timer countdown
  useEffect(() => {
    let timer;
    if (isResting && restTime > 0 && !isPaused) {
      timer = setInterval(() => {
        setRestTime(t => t - 1);
      }, 1000);
    } else if (isResting && restTime === 0) {
      setIsResting(false);
      playBeep();
    }
    return () => clearInterval(timer);
  }, [isResting, restTime, isPaused]);

  if (!workout) {
    return (
      <div className="page-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentSets = setData[currentExerciseIndex] || [];

  const updateSet = (setIdx, field, val) => {
    setSetData(prev => {
      const updated = { ...prev };
      const setList = [...updated[currentExerciseIndex]];
      setList[setIdx] = { ...setList[setIdx], [field]: Math.max(0, val) };
      updated[currentExerciseIndex] = setList;
      return updated;
    });
  };

  const toggleSetComplete = (setIdx) => {
    const isCompleted = !currentSets[setIdx].completed;
    setSetData(prev => {
      const updated = { ...prev };
      const setList = [...updated[currentExerciseIndex]];
      setList[setIdx] = { ...setList[setIdx], completed: isCompleted };
      updated[currentExerciseIndex] = setList;
      return updated;
    });

    if (isCompleted) {
      // Update PR if weight > 0
      const currentSet = currentSets[setIdx];
      if (currentSet.weight > 0) {
        updatePersonalRecord(currentExercise.exerciseId, currentSet.weight, currentSet.reps);
      }
      // Start rest timer
      setInitialRestTime(currentExercise.restSeconds || 60);
      setRestTime(currentExercise.restSeconds || 60);
      setIsResting(true);
      setIsPaused(false);
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setIsResting(false);
    } else {
      handleFinishWorkout();
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setIsResting(false);
    }
  };

  const handleFinishWorkout = () => {
    const durationMin = Math.round((Date.now() - startTime) / 60000) || 1;
    let totalVol = 0;
    let completedExCount = 0;

    Object.keys(setData).forEach(exIdx => {
      const sets = setData[exIdx];
      const completedSets = sets.filter(s => s.completed);
      if (completedSets.length > 0) {
        completedExCount++;
      }
      completedSets.forEach(s => {
        totalVol += s.weight * s.reps;
      });
    });

    const savedEntry = {
      id: workout.id,
      name: workout.name,
      completedAt: new Date().toISOString(),
      duration: durationMin,
      totalVolume: totalVol,
      completedExercises: completedExCount,
      muscleGroups: workout.exercises.map(e => e.muscleGroup).filter((v, i, a) => a.indexOf(v) === i),
      emoji: workout.exercises[0]?.emoji || '🏋️'
    };

    saveWorkout(savedEntry);
    setIsFinished(true);

    // Generate Confetti
    const pieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      color: ['#00d4ff', '#7b2ff7', '#ff2d78', '#ff6b35', '#00e676'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 2
    }));
    setConfetti(pieces);
  };

  // Rest Timer progress SVG
  const timerRadius = 70;
  const timerCircumference = timerRadius * 2 * Math.PI;
  const timerDashoffset = initialRestTime > 0 
    ? timerCircumference - (restTime / initialRestTime) * timerCircumference 
    : 0;

  // Active workout progress
  const completedSetsAll = Object.values(setData).flat().filter(s => s.completed).length;
  const totalSetsAll = Object.values(setData).flat().length;
  const progressPercent = totalSetsAll > 0 ? (completedSetsAll / totalSetsAll) * 100 : 0;

  // Exercise Demo SVG Illustration (Dynamic Pulsing SVG based on muscle group)
  const renderSVGAnimation = () => {
    const isCore = currentExercise.muscleGroup === 'core';
    const isLegs = currentExercise.muscleGroup === 'legs';
    return (
      <svg viewBox="0 0 100 100" className="exercise-illustration" style={{ width: '120px', height: '120px' }}>
        <circle cx="50" cy="20" r="8" fill="var(--accent-cyan)" className="loading-pulse" />
        <line x1="50" y1="28" x2="50" y2="60" stroke="var(--text-primary)" strokeWidth="4" />
        {/* Arms */}
        <line x1="50" y1="35" x2="30" y2="45" stroke="var(--accent-purple)" strokeWidth="3" className="loading-pulse" />
        <line x1="50" y1="35" x2="70" y2="45" stroke="var(--accent-purple)" strokeWidth="3" className="loading-pulse" />
        {/* Legs */}
        <line x1="50" y1="60" x2="35" y2={isLegs ? "75" : "85"} stroke="var(--accent-pink)" strokeWidth="3.5" />
        <line x1="50" y1="60" x2="65" y2={isLegs ? "75" : "85"} stroke="var(--accent-pink)" strokeWidth="3.5" />
        {/* Barbell / Equipment */}
        {workout.exercises[currentExerciseIndex].equipment !== 'bodyweight' && (
          <g>
            <line x1="20" y1="45" x2="80" y2="45" stroke="var(--accent-orange)" strokeWidth="2.5" />
            <circle cx="20" cy="45" r="5" fill="var(--accent-orange)" />
            <circle cx="80" cy="45" r="5" fill="var(--accent-orange)" />
          </g>
        )}
      </svg>
    );
  };

  if (isFinished) {
    return (
      <div className="page-container flex flex-col items-center justify-center celebrate" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
        {confetti.map(p => (
          <div 
            key={p.id} 
            className="confetti-piece" 
            style={{ 
              left: `${p.x}px`, 
              backgroundColor: p.color, 
              animationDelay: `${p.delay}s`,
              width: '8px',
              height: '14px'
            }} 
          />
        ))}
        
        <div className="stat-icon stat-icon-cyan avatar avatar-lg mb-lg" style={{ width: '80px', height: '80px' }}>
          <Trophy size={42} />
        </div>
        <h1 className="page-title text-center">Workout <span className="gradient-text">Complete!</span></h1>
        <p className="page-subtitle text-center mb-xl">Phenomenal job. You crushed it today!</p>

        <div className="glass-card w-full mb-xl">
          <div className="workout-summary-grid">
            <div className="text-center" style={{ borderRight: '1px solid var(--border-glass)', padding: 'var(--space-sm)' }}>
              <div className="stat-value text-accent">{workout.exercises.length}</div>
              <div className="stat-label">Exercises</div>
            </div>
            <div className="text-center" style={{ padding: 'var(--space-sm)' }}>
              <div className="stat-value text-accent">
                {Math.round((Date.now() - startTime) / 60000)}m
              </div>
              <div className="stat-label">Duration</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-glass)', margin: 'var(--space-md) 0' }}></div>
          <div className="workout-summary-grid">
            <div className="text-center" style={{ borderRight: '1px solid var(--border-glass)', padding: 'var(--space-sm)' }}>
              <div className="stat-value text-accent">{totalSetsAll}</div>
              <div className="stat-label">Total Sets</div>
            </div>
            <div className="text-center" style={{ padding: 'var(--space-sm)' }}>
              <div className="stat-value text-accent">
                {Object.values(setData).flat().filter(s => s.completed).reduce((sum, s) => sum + s.weight * s.reps, 0)}
              </div>
              <div className="stat-label">Volume (kg)</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Header & Leave Workout Button */}
      <div className="flex justify-between items-center mb-md">
        <button className="btn btn-ghost btn-sm flex items-center gap-xs" onClick={() => navigate('/')}>
          <ChevronLeft size={16} /> Exit Workout
        </button>
        <span className="text-xs text-tertiary font-bold">{currentExerciseIndex + 1} of {workout.exercises.length} Exercises</span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-lg">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* Rest Timer overlay when resting */}
      {isResting && (
        <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card text-center flex flex-col items-center justify-center" style={{ width: '280px', padding: 'var(--space-xl)' }}>
            <h2 className="mb-sm">Rest Period</h2>
            <p className="text-xs text-tertiary mb-md">Prep for next set</p>

            <div className="rest-timer-ring mb-md">
              <svg width={timerRadius * 2 + 10} height={timerRadius * 2 + 10}>
                <circle 
                  cx={timerRadius + 5} 
                  cy={timerRadius + 5} 
                  r={timerRadius} 
                  fill="none" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="6" 
                />
                <circle 
                  cx={timerRadius + 5} 
                  cy={timerRadius + 5} 
                  r={timerRadius} 
                  fill="none" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth="6" 
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="rest-timer-time">{restTime}s</div>
            </div>

            <div className="flex gap-sm w-full">
              <button 
                className="btn btn-glass flex-1 btn-sm" 
                onClick={() => setRestTime(t => t + 10)}
              >
                +10s
              </button>
              <button 
                className="btn btn-glass btn-icon btn-sm" 
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button 
                className="btn btn-energy flex-1 btn-sm" 
                onClick={() => setIsResting(false)}
              >
                Skip <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Active Exercise View */}
      <div className="glass-card mb-lg text-center flex flex-col items-center">
        <span className="badge badge-intermediate mb-sm">{currentExercise.muscleGroup.toUpperCase()}</span>
        <h2 className="mb-sm">{currentExercise.emoji} {currentExercise.name}</h2>
        <p className="text-xs text-tertiary mb-md" style={{ maxWidth: '300px' }}>{currentExercise.notes}</p>

        {/* CSS SVG Illustration */}
        <div className="mb-md" style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-md)' }}>
          {renderSVGAnimation()}
        </div>
      </div>

      {/* Sets list */}
      <div className="flex flex-col gap-sm mb-lg">
        {currentSets.map((set, idx) => (
          <div key={idx} className={`set-row ${set.completed ? 'completed' : ''}`}>
            <span className="set-number">{idx + 1}</span>
            
            {/* Weight Control */}
            <div className="flex-1 flex flex-col items-center">
              <span className="text-xs text-tertiary mb-xs">Weight</span>
              <div className="number-input">
                <button onClick={() => updateSet(idx, 'weight', set.weight - 2.5)} disabled={set.completed}><Minus size={14} /></button>
                <input 
                  type="number" 
                  value={set.weight} 
                  onChange={(e) => updateSet(idx, 'weight', parseFloat(e.target.value) || 0)}
                  disabled={set.completed}
                />
                <button onClick={() => updateSet(idx, 'weight', set.weight + 2.5)} disabled={set.completed}><Plus size={14} /></button>
              </div>
            </div>

            {/* Reps Control */}
            <div className="flex-1 flex flex-col items-center">
              <span className="text-xs text-tertiary mb-xs">Reps</span>
              <div className="number-input">
                <button onClick={() => updateSet(idx, 'reps', set.reps - 1)} disabled={set.completed}><Minus size={14} /></button>
                <input 
                  type="number" 
                  value={set.reps} 
                  onChange={(e) => updateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                  disabled={set.completed}
                />
                <button onClick={() => updateSet(idx, 'reps', set.reps + 1)} disabled={set.completed}><Plus size={14} /></button>
              </div>
            </div>

            {/* Log Button */}
            <button 
              className={`btn btn-icon ${set.completed ? 'btn-primary' : 'btn-glass'}`} 
              onClick={() => toggleSetComplete(idx)}
              style={{ width: '40px', height: '40px' }}
            >
              <Check size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Nav Buttons */}
      <div className="flex justify-between items-center gap-md">
        <button 
          className="btn btn-glass flex-1" 
          onClick={prevExercise} 
          disabled={currentExerciseIndex === 0}
        >
          Previous
        </button>
        {currentExerciseIndex === workout.exercises.length - 1 ? (
          <button className="btn btn-energy flex-1" onClick={handleFinishWorkout}>
            Finish Workout
          </button>
        ) : (
          <button className="btn btn-primary flex-1" onClick={nextExercise}>
            Next Exercise
          </button>
        )}
      </div>
    </div>
  );
}

export default ActiveWorkout;
