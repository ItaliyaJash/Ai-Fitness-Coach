import { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Trophy, Flame, Plus, Scale, Trash2 } from 'lucide-react';
import { 
  getWorkoutHistory, 
  getPersonalRecords, 
  getBodyStats, 
  saveBodyStat, 
  getStreakData 
} from '../utils/storage';
import exercises from '../data/exercises';

// Register ChartJS elements
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Progress() {
  const [history, setHistory] = useState(() => getWorkoutHistory());
  const [prs, setPrs] = useState(() => getPersonalRecords());
  const [bodyStats, setBodyStats] = useState(() => getBodyStats());
  const [streakData, setStreakData] = useState(() => getStreakData());
  const [activeTab, setActiveTab] = useState('overview');
  const [weightInput, setWeightInput] = useState('');

  const handleAddWeight = () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 0) {
      const entry = {
        weight: val,
        date: new Date().toISOString()
      };
      saveBodyStat(entry);
      setBodyStats(getBodyStats());
      setWeightInput('');
    }
  };

  const exerciseMap = useMemo(() => {
    const m = {};
    exercises.forEach(e => { m[e.id] = e; });
    return m;
  }, []);

  // Format date utility
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Workout History processed by week
  const weeklyChartData = useMemo(() => {
    const counts = [0, 0, 0, 0];
    const volumes = [0, 0, 0, 0];
    const labels = ['3 Wks Ago', '2 Wks Ago', 'Last Week', 'This Week'];
    
    const now = new Date();
    history.forEach(w => {
      const wDate = new Date(w.completedAt);
      const diffTime = Math.abs(now - wDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let index = -1;
      if (diffDays <= 7) index = 3;
      else if (diffDays <= 14) index = 2;
      else if (diffDays <= 21) index = 1;
      else if (diffDays <= 28) index = 0;
      
      if (index !== -1) {
        counts[index]++;
        volumes[index] += w.totalVolume || 0;
      }
    });

    return {
      labels,
      counts,
      volumes
    };
  }, [history]);

  // Streak Activity Heatmap Grid calculations (last 28 days)
  const heatmapData = useMemo(() => {
    const cells = [];
    const now = new Date();
    const workoutDates = new Set(
      history.map(w => {
        const d = new Date(w.completedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    for (let i = 27; i >= 0; i--) {
      const day = new Date();
      day.setDate(now.getDate() - i);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      const hasWorkout = workoutDates.has(key);
      cells.push({
        dayName: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dateStr: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        level: hasWorkout ? 3 : 0
      });
    }
    return cells;
  }, [history]);

  const barChartConfig = {
    labels: weeklyChartData.labels,
    datasets: [
      {
        label: 'Sessions',
        data: weeklyChartData.counts,
        backgroundColor: 'rgba(0, 212, 255, 0.4)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const lineChartConfig = {
    labels: weeklyChartData.labels,
    datasets: [
      {
        fill: true,
        label: 'Volume (kg)',
        data: weeklyChartData.volumes,
        backgroundColor: 'rgba(123, 47, 247, 0.15)',
        borderColor: '#7b2ff7',
        borderWidth: 3,
        tension: 0.4,
      }
    ]
  };

  const bodyChartConfig = {
    labels: bodyStats.map(s => formatDate(s.date)),
    datasets: [
      {
        fill: true,
        label: 'Weight (kg)',
        data: bodyStats.map(s => s.weight),
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        borderColor: '#ff6b35',
        borderWidth: 3,
        tension: 0.3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Your <span className="gradient-text">Progress</span></h1>
      <p className="page-subtitle">Analyze workouts and track body stats</p>

      {/* Tabs */}
      <div className="tabs mb-lg">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          Records
        </button>
        <button 
          className={`tab ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Body Weight
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-lg">
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-card glass-card-sm stat-card">
              <div className="stat-icon stat-icon-cyan">
                <Flame size={20} />
              </div>
              <div>
                <div className="stat-value">{streakData.currentStreak}🔥</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>
            <div className="glass-card glass-card-sm stat-card">
              <div className="stat-icon stat-icon-purple">
                <Trophy size={20} />
              </div>
              <div>
                <div className="stat-value">{history.length}</div>
                <div className="stat-label">Total Workouts</div>
              </div>
            </div>
          </div>

          {/* Workout Frequency */}
          <div className="section-header">
            <span className="section-title">Weekly Sessions</span>
          </div>
          <div className="glass-card" style={{ height: '200px', padding: 'var(--space-md)' }}>
            <Bar data={barChartConfig} options={chartOptions} />
          </div>

          {/* Volume Progression */}
          <div className="section-header">
            <span className="section-title">Weekly Training Volume</span>
          </div>
          <div className="glass-card" style={{ height: '200px', padding: 'var(--space-md)' }}>
            <Line data={lineChartConfig} options={chartOptions} />
          </div>

          {/* Github Calendar */}
          <div className="section-header">
            <span className="section-title">Activity Grid (Past 4 Weeks)</span>
          </div>
          <div className="glass-card">
            <div className="streak-grid">
              {heatmapData.map((cell, idx) => (
                <div 
                  key={idx} 
                  className={`streak-cell ${cell.level > 0 ? 'level-2' : ''}`}
                  title={`${cell.dateStr}: ${cell.level > 0 ? 'Trained' : 'Rest Day'}`}
                  style={{ 
                    position: 'relative',
                    aspectRatio: '1', 
                    borderRadius: '4px',
                    backgroundColor: cell.level > 0 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                    boxShadow: cell.level > 0 ? '0 0 8px rgba(0, 212, 255, 0.4)' : 'none'
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-sm text-xs text-tertiary">
              <span>28 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Personal Records Tab */}
      {activeTab === 'records' && (
        <div className="flex flex-col gap-sm">
          {Object.keys(prs).length === 0 ? (
            <div className="glass-card text-center" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🏆</div>
              <p className="font-semibold text-secondary">No records logged yet</p>
              <p className="text-xs text-tertiary mt-xs">PRs are saved automatically when sets are finished!</p>
            </div>
          ) : (
            Object.entries(prs).map(([exId, record]) => {
              const ex = exerciseMap[exId];
              return (
                <div key={exId} className="glass-card glass-card-sm flex justify-between items-center celebrate">
                  <div className="flex items-center gap-sm">
                    <span style={{ fontSize: '1.6rem' }}>{ex?.emoji || '🏆'}</span>
                    <div>
                      <div className="font-semibold text-sm">{ex?.name || 'Exercise'}</div>
                      <div className="text-xs text-tertiary">{formatDate(record.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-accent" style={{ fontSize: 'var(--font-md)' }}>
                      {record.weight} kg
                    </span>
                    <span className="text-xs text-secondary"> × {record.reps} reps</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Body Stats Tab */}
      {activeTab === 'body' && (
        <div className="flex flex-col gap-lg">
          {/* Weight Log Field */}
          <div className="glass-card">
            <h3 className="mb-sm text-sm">Log Weight Measurement</h3>
            <div className="flex gap-sm">
              <input 
                type="number" 
                placeholder="e.g. 74.5" 
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleAddWeight}>
                Log Weight <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Weight Trend Chart */}
          {bodyStats.length > 0 ? (
            <>
              <div className="section-header">
                <span className="section-title">Weight Progression</span>
              </div>
              <div className="glass-card" style={{ height: '220px', padding: 'var(--space-md)' }}>
                <Line data={bodyChartConfig} options={chartOptions} />
              </div>

              {/* Weight Log List */}
              <div className="section-header">
                <span className="section-title">Measurement Logs</span>
              </div>
              <div className="flex flex-col gap-xs">
                {bodyStats.slice().reverse().map(stat => (
                  <div key={stat.id} className="glass-card glass-card-sm flex justify-between items-center" style={{ padding: '12px var(--space-md)' }}>
                    <span className="text-xs text-tertiary flex items-center gap-xs">
                      <Calendar size={12} /> {formatDate(stat.date)}
                    </span>
                    <span className="font-bold text-sm text-accent">{stat.weight} kg</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="glass-card text-center" style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚖️</div>
              <p className="font-semibold text-secondary">No weight logs recorded</p>
              <p className="text-xs text-tertiary mt-xs">Log your body weight to track physical changes over time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Progress;
