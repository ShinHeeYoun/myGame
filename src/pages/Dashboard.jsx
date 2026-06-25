import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Dashboard() {
  const { user, day, logout, txt } = useGame();
  const navigate = useNavigate();

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: '40px' }}>
        <div>
          <h1><span className="bolt-icon">⚡</span> {txt.dashboard}</h1>
          <p className="text-muted">Day {day} • {txt.player}: {user.code}</p>
        </div>
        <button onClick={logout} className="glass-button">{txt.logout}</button>
      </header>

      <div className="glass-panel" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 className="text-muted" style={{ fontWeight: 'normal', fontSize: '1.2rem' }}>{txt.totalBalance}</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
          <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>{txt.bankTitle}</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              {txt.bankDesc}
            </p>
          </div>
          <button onClick={() => navigate('/bank')} className="glass-button" style={{ width: '100%' }}>{txt.enterBank}</button>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>{txt.stockTitle}</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              {txt.stockDesc}
            </p>
          </div>
          <button onClick={() => navigate('/stock')} className="glass-button" style={{ width: '100%' }}>{txt.enterMarket}</button>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.6 }}>
          <div>
            <h3>{txt.cardTitle}</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              {txt.cardDesc}
            </p>
          </div>
          <button disabled className="glass-button" style={{ width: '100%' }}>{txt.comingSoon}</button>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>{txt.settingsTitle}</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              {txt.settingsDesc}
            </p>
          </div>
          <button onClick={() => navigate('/settings')} className="glass-button" style={{ width: '100%' }}>{txt.enterSettings}</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
