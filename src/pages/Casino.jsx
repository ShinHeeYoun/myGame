import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { BlackjackGame } from '../components/casino/BlackjackGame';
import { SlotMachineGame } from '../components/casino/SlotMachineGame';

export default function Casino() {
  const { txt } = useGame();
  const [activeTab, setActiveTab] = useState('BLACKJACK');

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('BLACKJACK')}
          className="glass-button"
          style={{ flex: 1, padding: '16px', fontSize: '1.2rem', fontWeight: 'bold', background: activeTab === 'BLACKJACK' ? 'var(--accent-bolt)' : 'transparent' }}
        >
          {txt.bjTitle}
        </button>
        <button 
          onClick={() => setActiveTab('SLOT')}
          className="glass-button"
          style={{ flex: 1, padding: '16px', fontSize: '1.2rem', fontWeight: 'bold', background: activeTab === 'SLOT' ? 'var(--accent-bolt)' : 'transparent' }}
        >
          {txt.slotTitle}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {activeTab === 'BLACKJACK' ? <BlackjackGame /> : <SlotMachineGame />}
      </div>
    </div>
  );
}
