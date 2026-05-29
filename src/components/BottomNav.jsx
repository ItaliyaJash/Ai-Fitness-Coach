import { NavLink } from 'react-router-dom';
import { Activity, Zap, Dumbbell, TrendingUp, User } from 'lucide-react';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Activity />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/generate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Zap />
        <span>Generate</span>
      </NavLink>
      <NavLink to="/exercises" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Dumbbell />
        <span>Library</span>
      </NavLink>
      <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <TrendingUp />
        <span>Progress</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
