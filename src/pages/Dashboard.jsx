import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Dashboard() {
  const { user, day, logout } = useGame();
  const navigate = useNavigate();

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: '40px' }}>
        <div>
          <h1><span className="bolt-icon">⚡</span> Dashboard</h1>
          <p className="text-muted">Day {day} • Player: {user.code}</p>
        </div>
        <button onClick={logout} className="glass-button">Logout</button>
      </header>

      <div className="glass-panel" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 className="text-muted" style={{ fontWeight: 'normal', fontSize: '1.2rem' }}>Total Balance</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
          <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>🏦 Bank</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              Deposit your Bolts to earn daily interest, or take out a loan for more capital.
            </p>
          </div>
          <button onClick={() => navigate('/bank')} className="glass-button" style={{ width: '100%' }}>Enter Bank</button>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>📈 Stock Market</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              Trade stocks in a volatile market. High risk, high reward.
            </p>
          </div>
          <button onClick={() => navigate('/stock')} className="glass-button" style={{ width: '100%' }}>Enter Market</button>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.6 }}>
          <div>
            <h3>🃏 Card Game</h3>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              Play Blackjack to multiply your Bolts.
            </p>
          </div>
          <button disabled className="glass-button" style={{ width: '100%' }}>Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
