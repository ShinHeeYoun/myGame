import React from 'react';

export const BetButton = ({ label, isActive, onClick }) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className="glass-button" 
    style={{ 
      flex: 1, padding: '12px 0', fontSize: '1.1rem', fontWeight: 'bold',
      background: isActive ? 'var(--accent-bolt)' : 'rgba(14, 165, 233, 0.1)', 
      color: isActive ? '#fff' : 'var(--accent-bolt)'
    }}
  >
    {label}
  </button>
);
