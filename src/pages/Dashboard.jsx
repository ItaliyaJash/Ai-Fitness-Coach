import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Flame,
  Dumbbell,
  TrendingUp,
  ChevronRight,
  Zap,
  Calendar,
  Trophy,
  Clock,
} from 'lucide-react';
import { getProfile, getWorkoutHistory, getStreakData } from '../utils/storage';

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [animateRing, setAnimateRing] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setHistory(getWorkoutHistory());
    setStreak(getStreakData().currentStreak);
    // Trigger ring animation after mount
    const timer = setTimeout(() => setAnimateRing(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const workoutsThisWeek = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return history.filter(
      (w) => new Date(w.completedAt) >= startOfWeek
    ).length;
  }, [history]);

  const totalVolume = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return history
      .filter((w) => new Date(w.completedAt) >= startOfWeek)
      .reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  }, [history]);

  const recentWorkouts = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);
  }, [history]);

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const profileName = profile.name || 'Athlete';

  // Weekly progress ring calculations
  const weeklyGoal = 4;
  const progress = Math.min(workoutsThisWeek / weeklyGoal, 1);
  const radius = 80;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = animateRing
    ? circumference - progress * circumference
    : circumference;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const muscleEmojis = {
    chest: '🫁',
    back: '🔙',
    legs: '🦵',
    shoulders: '🫸',
    arms: '💪',
    core: '🎯',
    full_body: '🏋️',
  };

  return (
    <div className="page-container">
      {/* Hero Greeting */}
      <h1 className="page-title">
        {greeting},{' '}
        <span className="gradient-text">{profileName}</span> 💪
      </h1>
      <p className="page-subtitle">Let's crush your goals today</p>

      {/* Today's Workout CTA */}
      <div
        className="glass-card glass-card-glow-cyan glass-card-interactive mb-lg"
        onClick={() => navigate('/generate')}
      >
        <div className="flex items-center gap-sm mb-sm">
          <div className="stat-icon stat-icon-cyan">
            <Zap size={22} />
          </div>
          <span className="font-bold" style={{ fontSize: 'var(--font-lg)' }}>
            Today's Workout
          </span>
        </div>
        <p className="text-secondary text-sm mb-md">
          Ready to train? Generate a personalized workout tailored to your goals.
        </p>
        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); navigate('/generate'); }}>
          Generate Workout <Zap size={18} />
        </button>
      </div>

      {/* Quick Stats Row */}
      <div
        className="mb-lg"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}
      >
        <div className="glass-card glass-card-sm text-center">
          <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>
            {workoutsThisWeek}
          </div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="glass-card glass-card-sm text-center">
          <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>
            {streak}🔥
          </div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="glass-card glass-card-sm text-center">
          <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume}
          </div>
          <div className="stat-label">Volume (kg)</div>
        </div>
      </div>

      {/* Weekly Progress Ring */}
      <div className="section-header">
        <span className="section-title">Weekly Progress</span>
        <span className="section-subtitle">
          {workoutsThisWeek}/{weeklyGoal} workouts
        </span>
      </div>
      <div className="glass-card mb-lg flex flex-col items-center justify-center" style={{ padding: 'var(--space-xl)' }}>
        <div className="circular-progress">
          <svg width={radius * 2} height={radius * 2}>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#7b2ff7" />
              </linearGradient>
            </defs>
            <circle
              className="circular-progress-track"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeWidth={strokeWidth}
              stroke="rgba(255,255,255,0.05)"
            />
            <circle
              className="circular-progress-fill"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeWidth={strokeWidth}
              stroke="url(#progressGradient)"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
          </svg>
          <div className="circular-progress-label">
            <span className="stat-value" style={{ fontSize: 'var(--font-2xl)' }}>
              {Math.round(progress * 100)}%
            </span>
            <span className="stat-label">Complete</span>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="section-header">
        <span className="section-title">Recent Workouts</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/progress')}>
          View All <ChevronRight size={14} />
        </button>
      </div>

      {recentWorkouts.map((w, idx) => (
        <div
          key={w.id || idx}
          className="glass-card glass-card-sm glass-card-interactive mb-sm"
          onClick={() => navigate('/progress')}
        >
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <span style={{ fontSize: '1.4rem' }}>
                {w.emoji || '🏋️'}
              </span>
              <span className="font-semibold text-sm">{w.name || 'Workout'}</span>
            </div>
            <ChevronRight size={16} className="text-tertiary" />
          </div>
          <div className="flex items-center gap-md text-xs text-tertiary mb-sm">
            <span className="flex items-center gap-xs">
              <Calendar size={12} /> {formatDate(w.completedAt)}
            </span>
            <span className="flex items-center gap-xs">
              <Activity size={12} /> {w.completedExercises || w.exercises?.length || 0} exercises
            </span>
            {w.duration && (
              <span className="flex items-center gap-xs">
                <Clock size={12} /> {w.duration}m
              </span>
            )}
          </div>
          {w.muscleGroups && w.muscleGroups.length > 0 && (
            <div className="chip-group">
              {w.muscleGroups.slice(0, 3).map((m) => (
                <span key={m} className="badge badge-intermediate">
                  {muscleEmojis[m] || '💪'} {m}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {history.length === 0 && (
        <div className="glass-card text-center" style={{ padding: 'var(--space-2xl) var(--space-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🏃‍♂️</div>
          <p className="font-semibold mb-sm">No workouts yet</p>
          <p className="text-secondary text-sm mb-lg">
            Start your fitness journey! Generate your first personalized workout.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/generate')}>
            Generate First Workout <Zap size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
