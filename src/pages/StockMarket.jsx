import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function IntradayChart({ intradayHistory }) {
  const hours = Array.from({length: 12}, (_, i) => 9 + i);
  const pointsData = hours.map(h => intradayHistory[h]).filter(p => p !== undefined);
  if (pointsData.length === 0) return <div style={{ width: '150px' }}></div>;
  
  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = max - min || 1;
  const width = 150;
  const height = 30;

  const points = hours.map((h, idx) => {
    const val = intradayHistory[h];
    if (val === undefined) return null;
    const x = (idx / 11) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).filter(Boolean).join(' ');

  const isUp = pointsData[pointsData.length - 1] >= pointsData[0];
  const color = isUp ? 'var(--success)' : 'var(--danger)';

  return (
    <div style={{ position: 'relative', width: width + 'px' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        <span>9</span><span>12</span><span>15</span><span>20</span>
      </div>
    </div>
  );
}

function StockChart({ stock, txt, user, setUser }) {
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

  const handleDoubleClick = () => {
    const owned = user.portfolio[stock.id] || 0;
    if (owned > 0) {
      const revenue = owned * stock.currentPrice;
      setUser({
        ...user,
        bolts: user.bolts + revenue,
        portfolio: {
          ...user.portfolio,
          [stock.id]: 0
        }
      });
    }
  };

  return (
    <div onDoubleClick={handleDoubleClick} style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', userSelect: 'none' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>{stock.name} {txt.priceHistory}</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
            <button
              key={r}
              onClick={(e) => { e.stopPropagation(); setRange(r); }}
              style={{
                background: range === r ? 'var(--accent-bolt)' : 'transparent',
                border: '1px solid var(--accent-bolt)',
                color: range === r ? '#fff' : 'var(--accent-bolt)',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
        * Double click chart to auto-sell all shares
      </div>
      <div style={{ height: '250px', width: '100%' }}>
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

function TimelineBar({ dayProgressRatio }) {
  const openPercent = (9 / 24) * 100;
  const closePercent = (20 / 24) * 100;
  const currentPercent = dayProgressRatio * 100;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ position: 'relative', width: '100%', height: '12px', background: 'var(--danger)', borderRadius: '6px', overflow: 'hidden' }}>
        {/* Trading hours (Green) */}
        <div style={{ 
          position: 'absolute', 
          left: `${openPercent}%`, 
          width: `${closePercent - openPercent}%`, 
          height: '100%', 
          background: 'var(--success)' 
        }} />
        
        {/* Current Time Marker */}
        <div style={{
          position: 'absolute',
          left: `${currentPercent}%`,
          top: 0,
          width: '4px',
          height: '100%',
          background: '#fff',
          boxShadow: '0 0 8px rgba(255,255,255,0.8)',
          transform: 'translateX(-50%)',
          transition: 'left 1s linear'
        }} />
      </div>
      <div style={{ position: 'relative', width: '100%', height: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        <span style={{ position: 'absolute', left: '0' }}>00:00</span>
        <span style={{ position: 'absolute', left: `${openPercent}%`, transform: 'translateX(-50%)' }}>09:00 (Open)</span>
        <span style={{ position: 'absolute', left: `${closePercent}%`, transform: 'translateX(-50%)' }}>20:00 (Close)</span>
        <span style={{ position: 'absolute', right: '0' }}>24:00</span>
      </div>
    </div>
  );
}

function StockMarket() {
  const { user, setUser, stocks, txt, currentHour, dayProgressRatio, userPortfolioValue } = useGame();
  
  const [buyQuantities, setBuyQuantities] = useState({});
  const [sellQuantities, setSellQuantities] = useState({});
  const [activeStockId, setActiveStockId] = useState(null);

  const isMarketOpen = currentHour >= 9 && currentHour < 20;

  const handleBuyChange = (id, val, stockPrice) => {
    let numVal = parseInt(val, 10);
    const maxBuy = Math.floor(user.bolts / stockPrice);
    if (!isNaN(numVal) && numVal > maxBuy) {
      setBuyQuantities(prev => ({ ...prev, [id]: maxBuy.toString() }));
    } else {
      setBuyQuantities(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleSellChange = (id, val, owned) => {
    let numVal = parseInt(val, 10);
    if (!isNaN(numVal) && numVal > owned) {
      setSellQuantities(prev => ({ ...prev, [id]: owned.toString() }));
    } else {
      setSellQuantities(prev => ({ ...prev, [id]: val }));
    }
  };

  const buyStock = (stockId, price, e) => {
    e.stopPropagation();
    const qtyStr = buyQuantities[stockId];
    if (!qtyStr || parseInt(qtyStr) === 0) {
      const maxBuy = Math.floor(user.bolts / price);
      if (maxBuy > 0) setBuyQuantities(prev => ({ ...prev, [stockId]: maxBuy.toString() }));
      return;
    }
    const qty = parseInt(qtyStr);
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
        setBuyQuantities(prev => ({ ...prev, [stockId]: '' }));
      } else {
        alert(txt.notEnoughBolts);
      }
    }
  };

  const sellStock = (stockId, price, e) => {
    e.stopPropagation();
    const owned = user.portfolio[stockId] || 0;
    const qtyStr = sellQuantities[stockId];
    if (!qtyStr || parseInt(qtyStr) === 0) {
      if (owned > 0) setSellQuantities(prev => ({ ...prev, [stockId]: owned.toString() }));
      return;
    }
    const qty = parseInt(qtyStr);
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
      setSellQuantities(prev => ({ ...prev, [stockId]: '' }));
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    const ownedA = user.portfolio[a.id] || 0;
    const ownedB = user.portfolio[b.id] || 0;
    if (ownedA > 0 && ownedB === 0) return -1;
    if (ownedB > 0 && ownedA === 0) return 1;
    return a.id.localeCompare(b.id);
  });

  const activeStock = stocks.find(s => s.id === activeStockId);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h2>{txt.stockHeader}</h2>
        <div style={{ textAlign: 'right' }}>
          <div className="text-muted">{txt.portfolioValue}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
            ⚡{userPortfolioValue.toLocaleString()}
          </div>
        </div>
      </div>

      <TimelineBar dayProgressRatio={dayProgressRatio} />
      
      {!isMarketOpen && (
        <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px', background: 'rgba(234, 179, 8, 0.1)', borderColor: 'var(--warning)', color: 'var(--warning)', textAlign: 'center' }}>
          Market is closed. Trading hours are 09:00 - 19:59.
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Stocks List */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedStocks.map(stock => {
            const owned = user.portfolio[stock.id] || 0;
            const previousClose = stock.dailyHistory.length > 1 ? stock.dailyHistory[stock.dailyHistory.length - 2].price : stock.initialPrice;
            const dailyRatio = stock.currentPrice / previousClose;
            
            let colorClass = '';
            if (dailyRatio > 1.05) colorClass = 'text-success';
            else if (dailyRatio < 0.95) colorClass = 'text-danger';

            const isActive = activeStockId === stock.id;

            return (
              <div 
                key={stock.id} 
                className="glass-panel" 
                style={{ 
                  padding: '16px 24px', 
                  opacity: stock.isDelisted ? 0.5 : (!isMarketOpen && owned === 0 ? 0.7 : 1),
                  cursor: stock.isDelisted ? 'not-allowed' : 'pointer',
                  border: isActive ? '2px solid var(--accent-bolt)' : '1px solid var(--card-border)'
                }}
                onClick={() => !stock.isDelisted && setActiveStockId(stock.id)}
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
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      {!stock.isDelisted && <IntradayChart intradayHistory={stock.intradayHistory} />}
                    </div>

                    <div style={{ width: '80px', textAlign: 'center' }}>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.owned}</div>
                      <div style={{ fontWeight: 'bold' }}>{owned}</div>
                    </div>
                  </div>

                  {!stock.isDelisted && (
                    <div style={{ marginLeft: '24px', minWidth: '220px', display: 'flex', justifyContent: 'flex-end' }}>
                      {isMarketOpen ? (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number"
                              className="glass-input"
                              style={{ width: '70px', padding: '8px' }}
                              placeholder={txt.buy}
                              value={buyQuantities[stock.id] || ''}
                              onChange={(e) => handleBuyChange(stock.id, e.target.value, stock.currentPrice)}
                              onClick={(e) => e.stopPropagation()}
                              min="1"
                            />
                            <button 
                              onClick={(e) => buyStock(stock.id, stock.currentPrice, e)}
                              className="glass-button" 
                              style={{ padding: '8px', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'var(--success)', color: 'var(--success)' }}
                            >
                              {txt.buy}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number"
                              className="glass-input"
                              style={{ width: '70px', padding: '8px' }}
                              placeholder={txt.sell}
                              value={sellQuantities[stock.id] || ''}
                              onChange={(e) => handleSellChange(stock.id, e.target.value, owned)}
                              onClick={(e) => e.stopPropagation()}
                              min="1"
                              disabled={owned <= 0}
                            />
                            <button 
                              onClick={(e) => sellStock(stock.id, stock.currentPrice, e)}
                              className="glass-button" 
                              style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                              disabled={owned <= 0}
                            >
                              {txt.sell}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Change</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={colorClass}>
                            {((dailyRatio - 1) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Fixed Chart */}
        <div style={{ flex: 1, position: 'sticky', top: '100px' }}>
          {activeStock ? (
            <StockChart stock={activeStock} txt={txt} user={user} setUser={setUser} />
          ) : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a stock to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockMarket;
