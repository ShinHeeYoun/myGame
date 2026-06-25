import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function Sparkline({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; 
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

function StockChart({ stock, txt }) {
  const [range, setRange] = useState('ALL'); 
  const currentDay = stock.dailyHistory[stock.dailyHistory.length - 1].day;

  const getFilteredData = () => {
    let daysToSubtract = 0;
    if (range === '3M') daysToSubtract = 90;
    if (range === '6M') daysToSubtract = 180;
    if (range === '1Y') daysToSubtract = 365;
    if (range === '5Y') daysToSubtract = 1825;

    if (daysToSubtract === 0) return stock.dailyHistory;
    const startDay = Math.max(1, currentDay - daysToSubtract);
    return stock.dailyHistory.filter(d => d.day >= startDay);
  };

  const data = getFilteredData();
  const isUp = data.length > 0 && data[data.length - 1].price >= data[0].price;
  const strokeColor = isUp ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '4px' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Day {payload[0].payload.day}</p>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--accent-bolt)' }}>⚡{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginTop: '16px' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>{txt.priceHistory}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
            <button
              key={r}
              onClick={(e) => { e.stopPropagation(); setRange(r); }}
              style={{
                background: range === r ? 'var(--accent-bolt)' : 'transparent',
                border: '1px solid var(--accent-bolt)',
                color: range === r ? '#fff' : 'var(--accent-bolt)',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stock.initialPrice} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StockMarket() {
  const { user, setUser, stocks, day, txt } = useGame();
  const navigate = useNavigate();

  const [tradeQuantities, setTradeQuantities] = useState({});
  const [activeStockId, setActiveStockId] = useState(null);

  const handleQuantityChange = (id, val) => {
    setTradeQuantities(prev => ({ ...prev, [id]: val }));
  };

  const buyStock = (stockId, price, e) => {
    e.stopPropagation();
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
        alert(txt.notEnoughBolts);
      }
    }
  };

  const sellStock = (stockId, price, e) => {
    e.stopPropagation();
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
          <button onClick={() => navigate('/')} className="glass-button">{txt.back}</button>
          <div>
            <h1>{txt.stockHeader}</h1>
            <p className="text-muted">Day {day} • {txt.stockSub}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-muted">{txt.walletBalance}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
            <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
          </div>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            {txt.portfolioValue}: ⚡{portfolioValue.toLocaleString()}
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

          const isActive = activeStockId === stock.id;

          return (
            <div 
              key={stock.id} 
              className="glass-panel" 
              style={{ 
                padding: '16px 24px', 
                opacity: stock.isDelisted ? 0.5 : 1,
                cursor: stock.isDelisted ? 'not-allowed' : 'pointer',
                border: isActive ? '1px solid var(--accent-bolt)' : '1px solid var(--card-border)'
              }}
              onClick={() => !stock.isDelisted && setActiveStockId(isActive ? null : stock.id)}
            >
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                  <div style={{ width: '80px' }}>
                    <h3 style={{ margin: 0 }}>{stock.name}</h3>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.ipo}: ⚡{stock.initialPrice}</div>
                  </div>
                  
                  <div style={{ width: '100px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={colorClass}>
                      {stock.isDelisted ? txt.delisted : `⚡${stock.currentPrice}`}
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
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.owned}</div>
                    <div style={{ fontWeight: 'bold' }}>{owned}</div>
                  </div>
                </div>

                {!stock.isDelisted && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                    <input 
                      type="number"
                      className="glass-input"
                      style={{ width: '80px', padding: '8px' }}
                      placeholder={txt.qty}
                      value={tradeQuantities[stock.id] || ''}
                      onChange={(e) => handleQuantityChange(stock.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      min="1"
                    />
                    <button 
                      onClick={(e) => buyStock(stock.id, stock.currentPrice, e)}
                      className="glass-button" 
                      style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'var(--success)', color: 'var(--success)' }}
                    >
                      {txt.buy}
                    </button>
                    <button 
                      onClick={(e) => sellStock(stock.id, stock.currentPrice, e)}
                      className="glass-button" 
                      style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      disabled={owned <= 0}
                    >
                      {txt.sell}
                    </button>
                  </div>
                )}
              </div>

              {isActive && !stock.isDelisted && (
                <div onClick={(e) => e.stopPropagation()}>
                  <StockChart stock={stock} txt={txt} />
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
