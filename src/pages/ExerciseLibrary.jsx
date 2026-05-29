import { useState } from 'react';
import { Search, Info, X } from 'lucide-react';
import exercises, { muscleGroups, equipmentTypes, muscleGroupEmoji, equipmentEmoji } from '../data/exercises';

function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Filter exercises
  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = filterMuscle === 'all' || ex.muscleGroup === filterMuscle;
    const matchesEquip = filterEquipment === 'all' || ex.equipment === filterEquipment;
    return matchesSearch && matchesMuscle && matchesEquip;
  });

  const muscleColors = {
    chest: 'rgba(255, 107, 53, 0.15)',
    back: 'rgba(0, 212, 255, 0.15)',
    legs: 'rgba(123, 47, 247, 0.15)',
    shoulders: 'rgba(255, 214, 0, 0.15)',
    arms: 'rgba(255, 45, 120, 0.15)',
    core: 'rgba(0, 230, 118, 0.15)'
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Exercise <span className="gradient-text">Library</span></h1>
      <p className="page-subtitle">{exercises.length}+ exercises with detailed guides</p>

      {/* Search Input */}
      <div className="search-bar mb-md">
        <Search />
        <input 
          placeholder="Search exercises..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* Muscle Filters */}
      <div className="section-header">
        <span className="section-title text-xs">Muscle Groups</span>
      </div>
      <div className="chip-group mb-sm" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          className={`chip ${filterMuscle === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMuscle('all')}
        >
          All
        </button>
        {muscleGroups.map(mg => (
          <button 
            key={mg}
            className={`chip ${filterMuscle === mg ? 'active' : ''}`}
            onClick={() => setFilterMuscle(mg)}
          >
            {muscleGroupEmoji[mg] || '💪'} {mg.charAt(0).toUpperCase() + mg.slice(1)}
          </button>
        ))}
      </div>

      {/* Equipment Filters */}
      <div className="section-header">
        <span className="section-title text-xs">Equipment Types</span>
      </div>
      <div className="chip-group mb-lg" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          className={`chip chip-orange ${filterEquipment === 'all' ? 'active' : ''}`}
          onClick={() => setFilterEquipment('all')}
        >
          All Equipment
        </button>
        {equipmentTypes.map(eq => (
          <button 
            key={eq}
            className={`chip chip-orange ${filterEquipment === eq ? 'active' : ''}`}
            onClick={() => setFilterEquipment(eq)}
          >
            {equipmentEmoji[eq] || '🏋️'} {eq.charAt(0).toUpperCase() + eq.slice(1)}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-tertiary mb-md">{filtered.length} exercises found</p>

      {/* Exercise Card List */}
      <div className="flex flex-col gap-sm">
        {filtered.map(ex => (
          <div 
            className="exercise-card" 
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
          >
            <div 
              className="exercise-card-icon" 
              style={{ backgroundColor: muscleColors[ex.muscleGroup] || 'var(--bg-glass-strong)' }}
            >
              {ex.emoji || '🏋️'}
            </div>
            <div className="exercise-card-info">
              <div className="exercise-card-name">{ex.name}</div>
              <div className="exercise-card-meta">
                {ex.muscleGroup.toUpperCase()} · {ex.equipment.toUpperCase()}
              </div>
            </div>
            <span className={`badge badge-${ex.difficulty}`}>{ex.difficulty}</span>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="modal-overlay" onClick={() => setSelectedExercise(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            
            <div className="flex justify-between items-center mb-md">
              <span className="badge badge-intermediate">{selectedExercise.muscleGroup.toUpperCase()}</span>
              <button 
                className="btn btn-glass btn-icon btn-sm" 
                style={{ width: '32px', height: '32px' }}
                onClick={() => setSelectedExercise(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
              {selectedExercise.emoji}
            </div>

            <h2 className="text-center mb-md">{selectedExercise.name}</h2>

            <div className="chip-group justify-center mb-lg">
              <span className="chip active">{selectedExercise.equipment.toUpperCase()}</span>
              <span className={`badge badge-${selectedExercise.difficulty}`}>{selectedExercise.difficulty.toUpperCase()}</span>
            </div>

            <div className="section-header">
              <span className="section-title">Instructions</span>
            </div>
            <div className="glass-card mb-md text-sm text-secondary" style={{ padding: 'var(--space-md)' }}>
              {selectedExercise.instructions}
            </div>

            <div className="section-header">
              <span className="section-title">Pro Tips</span>
            </div>
            <div className="glass-card mb-md text-sm text-secondary" style={{ borderColor: 'rgba(255, 214, 0, 0.2)', padding: 'var(--space-md)' }}>
              <div className="flex gap-sm">
                <Info size={18} className="text-accent" style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                <span>{selectedExercise.tips || 'Keep movements slow and deliberate. Focus on a tight squeeze at peak contraction.'}</span>
              </div>
            </div>

            <div className="flex gap-md mt-lg">
              <button className="btn btn-primary btn-block" onClick={() => setSelectedExercise(null)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseLibrary;
