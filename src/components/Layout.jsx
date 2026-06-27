import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../GameContext';

function Layout() {
  const { user, day, timeStr, logout, txt } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Outlet />;

  return (
    <div className="container">
      <header className="glass-panel flex-between" style={{ marginBottom: '24px', position: 'sticky', top: '16px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}><span className="bolt-icon">⚡</span> {txt.appName}</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Day {day} • {timeStr} • {txt.player}: {user.code}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => navigate('/')} 
              className="glass-button" 
              style={{ padding: '8px 16px', background: location.pathname === '/' ? 'var(--accent-bolt)' : '', color: location.pathname === '/' ? '#fff' : '' }}
            >
              {txt.dashboard}
            </button>
            <button 
              onClick={() => navigate('/bank')} 
              className="glass-button" 
              style={{ padding: '8px 16px', background: location.pathname === '/bank' ? 'var(--accent-bolt)' : '', color: location.pathname === '/bank' ? '#fff' : '' }}
            >
              {txt.bankTitle.replace('🏦 ', '')}
            </button>
            <button 
              onClick={() => navigate('/stock')} 
              className="glass-button" 
              style={{ padding: '8px 16px', background: location.pathname === '/stock' ? 'var(--accent-bolt)' : '', color: location.pathname === '/stock' ? '#fff' : '' }}
            >
              {txt.stockTitle.replace('📈 ', '')}
            </button>
            <button 
              onClick={() => navigate('/casino')} 
              className="glass-button" 
              style={{ padding: '8px 16px', background: location.pathname === '/casino' ? 'var(--accent-bolt)' : '', color: location.pathname === '/casino' ? '#fff' : '' }}
            >
              {txt.cardTitle.replace(/🎰 |🃏 /, '')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.totalBalance}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
              <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
            </div>
          </div>
          <button onClick={logout} className="glass-button" style={{ padding: '8px 16px' }}>{txt.logout}</button>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
