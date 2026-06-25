import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Settings() {
  const { language, setLanguage, speedStr, setSpeedStr, txt } = useGame();
  const navigate = useNavigate();

  return (
    <div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>{txt.language}</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setLanguage('ko')} 
              className="glass-button"
              style={{ background: language === 'ko' ? 'var(--accent-bolt)' : '', color: language === 'ko' ? '#fff' : '' }}
            >
              {txt.korean}
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className="glass-button"
              style={{ background: language === 'en' ? 'var(--accent-bolt)' : '', color: language === 'en' ? '#fff' : '' }}
            >
              {txt.english}
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>{txt.gameSpeed}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['veryFast', 'fast', 'normal', 'slow'].map(s => {
              const labelMap = {
                veryFast: txt.speedVeryFast,
                fast: txt.speedFast,
                normal: txt.speedNormal,
                slow: txt.speedSlow
              };
              return (
                <button 
                  key={s}
                  onClick={() => setSpeedStr(s)} 
                  className="glass-button"
                  style={{ background: speedStr === s ? 'var(--accent-bolt)' : '', color: speedStr === s ? '#fff' : '', textAlign: 'left' }}
                >
                  {labelMap[s]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
