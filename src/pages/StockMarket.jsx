import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Sparkline({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // avoid div by 0
  const height = 30;
  const width = 60;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? 'var(--success)' : 'var(--danger)';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function StockMarket() {
  const { user, setUser, stocks, day } = useGame();
  const navigate = useNavigate();

  const [tradeQuantities, setTradeQuantities] = useState({});

  const handleQuantityChange = (id, val) => {
    setTradeQuantities(prev => ({ ...prev, [id]: val }));
  };

  const buyStock = (stockId, price) => {
    const qty = parseInt(tradeQuantities[stockId] || 0);
    if (qty > 0) {
      const cost = qty * price;
      if (user.bolts >= cost) {
        setUser({
          ...user,
          bolts: user.bolts - cost,
          portfolio: {
            ...user.portfolio,
            [stockId]: (user.portfolio[stockId] || 0) + qty
          }
        });
        setTradeQuantities(prev => ({ ...prev, [stockId]: '' }));
      } else {
        alert("Not enough Bolts!");
      }
    }
  };

  const sellStock = (stockId, price) => {
    const qty = parseInt(tradeQuantities[stockId] || 0);
    const owned = user.portfolio[stockId] || 0;
    if (qty > 0 && owned >= qty) {
      const revenue = qty * price;
      setUser({
        ...user,
        bolts: user.bolts + revenue,
        portfolio: {
          ...user.portfolio,
          [stockId]: owned - qty
        }
      });
      setTradeQuantities(prev => ({ ...prev, [stockId]: '' }));
    }
  };

  // Calculate Portfolio Value
  const portfolioValue = Object.keys(user.portfolio).reduce((acc, stockId) => {
    const stock = stocks.find(s => s.id === stockId);
    if (stock) {
      return acc + (user.portfolio[stockId] * stock.currentPrice);
    }
    return acc;
  }, 0);

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/')} className="glass-button">← Back</button>
          <div>
            <h1>📈 Stock Market</h1>
            <p className="text-muted">Day {day} • High Risk, High Reward</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-muted">Wallet Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
            <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
          </div>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Portfolio Value: ⚡{portfolioValue.toLocaleString()}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {stocks.map(stock => {
          const owned = user.portfolio[stock.id] || 0;
          const ratio = stock.currentPrice / stock.initialPrice;
          let colorClass = '';
          if (ratio > 1.05) colorClass = 'text-success';
          else if (ratio < 0.95) colorClass = 'text-danger';

          return (
            <div key={stock.id} className="glass-panel flex-between" style={{ padding: '16px 24px', opacity: stock.isDelisted ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                <div style={{ width: '80px' }}>
                  <h3 style={{ margin: 0 }}>{stock.name}</h3>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>IPO: ⚡{stock.initialPrice}</div>
                </div>
                
                <div style={{ width: '100px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={colorClass}>
                    {stock.isDelisted ? 'DELISTED' : `⚡${stock.currentPrice}`}
                  </div>
                  {!stock.isDelisted && (
                    <div style={{ fontSize: '0.8rem' }} className={colorClass}>
                      {((ratio - 1) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {!stock.isDelisted && <Sparkline data={stock.history} />}
                </div>

                <div style={{ width: '100px', textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Owned</div>
                  <div style={{ fontWeight: 'bold' }}>{owned}</div>
                </div>
              </div>

              {!stock.isDelisted && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                  <input 
                    type="number"
                    className="glass-input"
                    style={{ width: '80px', padding: '8px' }}
                    placeholder="Qty"
                    value={tradeQuantities[stock.id] || ''}
                    onChange={(e) => handleQuantityChange(stock.id, e.target.value)}
                    min="1"
                  />
                  <button 
                    onClick={() => buyStock(stock.id, stock.currentPrice)}
                    className="glass-button" 
                    style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'var(--success)', color: 'var(--success)' }}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => sellStock(stock.id, stock.currentPrice)}
                    className="glass-button" 
                    style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    disabled={owned <= 0}
                  >
                    Sell
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StockMarket;
