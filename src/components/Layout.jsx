import BottomNav from './BottomNav';

function Layout({ children }) {
  return (
    <div className="app-layout">
      {/* Premium floating back-drops */}
      <div className="app-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      
      {/* Route layout views */}
      {children}

      {/* Main navigation */}
      <BottomNav />
    </div>
  );
}

export default Layout;
