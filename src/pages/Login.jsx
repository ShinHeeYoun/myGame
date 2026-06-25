import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Login() {
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const { login, generateCode, txt } = useGame();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      login(inputCode.trim());
      navigate('/');
    }
  };

  const handleGenerate = () => {
    const newCode = generateCode();
    setGeneratedCode(newCode);
    setInputCode(newCode); // Auto-fill for convenience
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="flex-center" style={{ marginBottom: '24px' }}>
          <span className="bolt-icon">⚡</span> {txt.appName}
        </h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              {txt.enterCode}
            </label>
            <input 
              className="glass-input" 
              value={inputCode} 
              onChange={(e) => setInputCode(e.target.value)} 
              placeholder={txt.enterCode}
              required 
            />
          </div>
          
          <button type="submit" className="glass-button" style={{ width: '100%', background: 'var(--accent-bolt)', color: '#fff' }}>
            {txt.loginBtn}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>{txt.noCode}</p>
          <button onClick={handleGenerate} className="glass-button" style={{ width: '100%' }}>
            {txt.generateCode}
          </button>
          
          {generatedCode && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid var(--success)' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--success)' }}>
                {txt.yourCodeIs} <strong>{generatedCode}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
