import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, ChevronRight, Check, Weight, AlertTriangle } from 'lucide-react';
import { 
  getProfile, 
  saveProfile, 
  exportAllData, 
  importAllData, 
  resetAllData 
} from '../utils/storage';
import { equipmentTypes, equipmentEmoji } from '../data/exercises';

function Profile() {
  const [profile, setProfile] = useState(() => getProfile());
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);

  const goals = [
    { id: 'muscle', label: 'Build Muscle', emoji: '💪' },
    { id: 'fat_loss', label: 'Burn Fat', emoji: '🔥' },
    { id: 'endurance', label: 'Endurance', emoji: '🫀' },
    { id: 'flexibility', label: 'Flexibility', emoji: '🧘' }
  ];

  const handleSave = () => {
    saveProfile(profile);
    showToast('Profile configuration saved!');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const dataStr = exportAllData();
    if (dataStr) {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitcoach-profile-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importAllData(event.target.result);
      if (result.success) {
        setProfile(getProfile());
        showToast('Profile data restored successfully!');
      } else {
        alert(`Failed to import data: ${result.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllData();
    setProfile(getProfile());
    setShowConfirmReset(false);
    showToast('All fitness data cleared!');
  };

  const toggleGoal = (goalId) => {
    const active = profile.goals || [];
    const updated = active.includes(goalId)
      ? active.filter(id => id !== goalId)
      : [...active, goalId];
    
    // Ensure at least one goal
    if (updated.length > 0) {
      setProfile({ ...profile, goals: updated });
    }
  };

  const toggleEquipment = (eqId) => {
    const active = profile.preferredEquipment || [];
    const updated = active.includes(eqId)
      ? active.filter(id => id !== eqId)
      : [...active, eqId];
    
    // Ensure at least one equipment
    if (updated.length > 0) {
      setProfile({ ...profile, preferredEquipment: updated });
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">
            <Check size={16} /> {toast}
          </div>
        </div>
      )}

      <h1 className="page-title">Your <span className="gradient-text">Profile</span></h1>
      <p className="page-subtitle">Configure personalized options & settings</p>

      {/* Profile Header Box */}
      <div className="glass-card mb-lg flex items-center gap-lg">
        <div className="avatar">
          {profile.name ? profile.name[0].toUpperCase() : 'A'}
        </div>
        <div style={{ flex: 1 }}>
          <input 
            className="input-field w-full"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Athlete Name"
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              background: 'transparent', 
              border: 'none', 
              padding: 0,
              boxShadow: 'none'
            }}
          />
          <div className="text-xs text-tertiary">Tap to edit name</div>
        </div>
      </div>

      {/* Fitness Level */}
      <div className="section-header">
        <span className="section-title">Fitness Level</span>
      </div>
      <div className="chip-group mb-lg">
        {['beginner', 'intermediate', 'advanced'].map(level => (
          <button 
            key={level}
            className={`chip chip-purple ${profile.fitnessLevel === level ? 'active' : ''}`}
            onClick={() => setProfile({ ...profile, fitnessLevel: level })}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Goals */}
      <div className="section-header">
        <span className="section-title">Training Goals</span>
      </div>
      <div className="chip-group mb-lg">
        {goals.map(g => (
          <button 
            key={g.id}
            className={`chip ${profile.goals?.includes(g.id) ? 'active' : ''}`}
            onClick={() => toggleGoal(g.id)}
            style={{ flex: '1 0 45%', justifyContent: 'center' }}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {/* Equipment preferences */}
      <div className="section-header">
        <span className="section-title">Preferred Equipment</span>
      </div>
      <div className="chip-group mb-lg">
        {equipmentTypes.map(eq => (
          <button 
            key={eq}
            className={`chip chip-orange ${profile.preferredEquipment?.includes(eq) ? 'active' : ''}`}
            onClick={() => toggleEquipment(eq)}
          >
            {equipmentEmoji[eq]} {eq.charAt(0).toUpperCase() + eq.slice(1)}
          </button>
        ))}
      </div>

      {/* Metric Weight Toggle */}
      <div className="glass-card mb-lg flex justify-between items-center" style={{ padding: '12px var(--space-md)' }}>
        <span className="text-sm font-semibold flex items-center gap-xs">
          <Weight size={18} /> Weight Units
        </span>
        <div className="chip-group">
          <button 
            className={`chip ${profile.units === 'kg' ? 'active' : ''}`}
            onClick={() => setProfile({ ...profile, units: 'kg' })}
          >
            kg
          </button>
          <button 
            className={`chip ${profile.units === 'lbs' ? 'active' : ''}`}
            onClick={() => setProfile({ ...profile, units: 'lbs' })}
          >
            lbs
          </button>
        </div>
      </div>

      <button className="btn btn-primary btn-block btn-lg mb-xl" onClick={handleSave}>
        Save Profile Settings
      </button>

      {/* Data Management Section */}
      <div className="section-header">
        <span className="section-title">Data & Maintenance</span>
      </div>
      <div className="flex flex-col gap-sm mb-lg">
        {/* Export Data */}
        <div 
          className="glass-card glass-card-sm glass-card-interactive flex justify-between items-center"
          onClick={handleExport}
        >
          <span className="text-sm flex items-center gap-sm">
            <Download size={16} /> Export Backup File (.json)
          </span>
          <ChevronRight size={16} className="text-tertiary" />
        </div>

        {/* Import Data */}
        <label 
          className="glass-card glass-card-sm glass-card-interactive flex justify-between items-center" 
          style={{ cursor: 'pointer', margin: 0 }}
        >
          <span className="text-sm flex items-center gap-sm">
            <Upload size={16} /> Import Backup File (.json)
          </span>
          <ChevronRight size={16} className="text-tertiary" />
          <input 
            type="file" 
            accept=".json" 
            onChange={handleImport} 
            style={{ display: 'none' }} 
          />
        </label>

        {/* Clear Data */}
        <div 
          className="glass-card glass-card-sm glass-card-interactive flex justify-between items-center"
          onClick={() => setShowConfirmReset(true)}
          style={{ borderColor: 'rgba(255, 45, 120, 0.25)' }}
        >
          <span className="text-sm flex items-center gap-sm text-accent" style={{ color: 'var(--accent-pink)' }}>
            <Trash2 size={16} /> Reset All Storage Data
          </span>
          <ChevronRight size={16} className="text-tertiary" />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="modal-overlay" onClick={() => setShowConfirmReset(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
              <AlertTriangle size={48} style={{ color: 'var(--accent-pink)' }} />
            </div>
            <h3 className="text-center mb-sm">Confirm Reset Operation</h3>
            <p className="text-secondary text-sm text-center mb-lg">
              This action is permanent. All profiles, workout history logs, body stats, and personal records will be completely deleted.
            </p>
            <div className="flex gap-md">
              <button className="btn btn-glass flex-1" onClick={() => setShowConfirmReset(false)}>
                Cancel
              </button>
              <button className="btn btn-energy flex-1" onClick={handleReset}>
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
