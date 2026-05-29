import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutGenerator from './pages/WorkoutGenerator';
import ActiveWorkout from './pages/ActiveWorkout';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import { syncWithBackend } from './utils/storage';

function App() {
  useEffect(() => {
    // Attempt database sync on mount
    syncWithBackend();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<WorkoutGenerator />} />
          <Route path="/workout/:id" element={<ActiveWorkout />} />
          <Route path="/workout" element={<ActiveWorkout />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
