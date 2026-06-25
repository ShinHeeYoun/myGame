import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function IntradayChart({ intradayHistory }) {
  const hours = Array.from({length: 12}, (_, i) => 9 + i);
  const pointsData = hours.map(h => intradayHistory[h]).filter(p => p !== undefined && p > 0);
  if (pointsData.length === 0) return <div style={{ width: '150px' }}></div>;
  
  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = max - min || 1;
  const width = 150;
  const height = 30;

  const points = hours.map((h, idx) => {
    const val = intradayHistory[h];
    if (val === undefined || val === 0) return null;
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

function VOSPIChart({ data, initialPrice }) {
  const [range, setRange] = useState('ALL'); 
  const currentDay = data.length > 0 ? data[data.length - 1].day : 1;

  const getFilteredData = () => {
    let daysToSubtract = 0;
    if (range === '3M') daysToSubtract = 90;
    if (range === '6M') daysToSubtract = 180;
    if (range === '1Y') daysToSubtract = 365;
    if (range === '5Y') daysToSubtract = 1825;

    if (daysToSubtract === 0) return data;
    const startDay = Math.max(1, currentDay - daysToSubtract);
    return data.filter(d => d.day >= startDay);
  };

  const chartData = getFilteredData();
  const isUp = chartData.length > 0 && chartData[chartData.length - 1].price >= chartData[0].price;
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
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '24px' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>VOSPI Index History</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['3M', '6M', '1Y', '5Y', 'ALL'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
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
      <div style={{ height: '250px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={initialPrice} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Bank() {
  const { user, setUser, depositRate, loanRate, txt, stocks, currentHour, vospi, vospiInitial, inversePrice } = useGame();
  
  const [activeTab, setActiveTab] = useState('BANK');

  // Bank States
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Fund States
  const [buyVOSPI, setBuyVOSPI] = useState('');
  const [sellVOSPI, setSellVOSPI] = useState('');
  const [buyINV, setBuyINV] = useState('');
  const [sellINV, setSellINV] = useState('');

  const isMarketOpen = currentHour >= 9 && currentHour < 20;

  const netWorth = user.bolts + user.deposit - user.loan;
  const maxLoan = Math.max(0, Math.floor(netWorth * 0.5) - user.loan);

  // Bank Handlers
  const handleDeposit = (e) => {
    e.preventDefault();
    if (!depositAmount || parseInt(depositAmount) === 0) {
      setDepositAmount(user.bolts.toString());
      return;
    }
    const amount = parseInt(depositAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.bolts) {
      setUser({ ...user, bolts: user.bolts - amount, deposit: user.deposit + amount });
      setDepositAmount('');
    }
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseInt(withdrawAmount) === 0) {
      setWithdrawAmount(user.deposit.toString());
      return;
    }
    const amount = parseInt(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.deposit) {
      setUser({ ...user, bolts: user.bolts + amount, deposit: user.deposit - amount });
      setWithdrawAmount('');
    }
  };

  const handleLoan = (e) => {
    e.preventDefault();
    if (!loanAmount || parseInt(loanAmount) === 0) {
      if (maxLoan > 0) setLoanAmount(maxLoan.toString());
      return;
    }
    const amount = parseInt(loanAmount);
    if (!isNaN(amount) && amount > 0 && amount <= maxLoan) {
      setUser({ ...user, bolts: user.bolts + amount, loan: user.loan + amount });
      setLoanAmount('');
    }
  };

  const handleRepay = (e) => {
    e.preventDefault();
    const maxRepay = Math.min(user.bolts, user.loan);
    if (!repayAmount || parseInt(repayAmount) === 0) {
      if (maxRepay > 0) setRepayAmount(maxRepay.toString());
      return;
    }
    const amount = parseInt(repayAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.bolts) {
      const actualRepayment = Math.min(amount, user.loan);
      setUser({ ...user, bolts: user.bolts - actualRepayment, loan: user.loan - actualRepayment });
      setRepayAmount('');
    }
  };

  // Fund Handlers
  const executeFundTrade = (type, action, inputVal, setInputStr) => {
    const isVOSPI = type === 'VOSPI';
    const price = isVOSPI ? vospi : inversePrice;
    const ticker = isVOSPI ? 'VOSPI' : 'VOSPI_INV';
    const owned = user.portfolio[ticker] || 0;

    if (action === 'BUY') {
      const qtyStr = inputVal;
      if (!qtyStr || parseInt(qtyStr) === 0) {
        const maxBuy = Math.floor(user.bolts / price);
        if (maxBuy > 0) setInputStr(maxBuy.toString());
        return;
      }
      const qty = parseInt(qtyStr);
      if (qty > 0) {
        const cost = qty * price;
        if (user.bolts >= cost) {
          setUser({
            ...user,
            bolts: user.bolts - cost,
            portfolio: { ...user.portfolio, [ticker]: owned + qty }
          });
          setInputStr('');
        }
      }
    } else {
      const qtyStr = inputVal;
      if (!qtyStr || parseInt(qtyStr) === 0) {
        if (owned > 0) setInputStr(owned.toString());
        return;
      }
      const qty = parseInt(qtyStr);
      if (qty > 0 && owned >= qty) {
        const revenue = qty * price;
        setUser({
          ...user,
          bolts: user.bolts + revenue,
          portfolio: { ...user.portfolio, [ticker]: owned - qty }
        });
        setInputStr('');
      }
    }
  };

  // VOSPI History construction
  const dailyHistoryDays = stocks[0].dailyHistory.map(d => d.day);
  const vospiDailyHistory = dailyHistoryDays.map(day => {
    const price = stocks.reduce((sum, stock) => {
      const dayData = stock.dailyHistory.find(d => d.day === day);
      return sum + (dayData ? dayData.price : stock.initialPrice);
    }, 0);
    return { day, price };
  });

  const hours = Array.from({length: 12}, (_, i) => 9 + i);
  const vospiIntradayHistory = {};
  hours.forEach(h => {
    vospiIntradayHistory[h] = stocks.reduce((sum, s) => sum + (s.intradayHistory[h] || 0), 0);
  });

  const vospiRatio = vospi / vospiInitial;
  const vospiColor = vospiRatio >= 1 ? 'text-success' : 'text-danger';
  const invRatio = inversePrice / vospiInitial;
  const invColor = invRatio >= 1 ? 'text-success' : 'text-danger';

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className="glass-button" 
          onClick={() => setActiveTab('BANK')}
          style={{ background: activeTab === 'BANK' ? 'var(--accent-bolt)' : 'transparent', color: activeTab === 'BANK' ? '#fff' : 'var(--text-color)' }}
        >
          🏦 {txt.bankTitle.replace('🏦 ', '')}
        </button>
        <button 
          className="glass-button" 
          onClick={() => setActiveTab('FUNDS')}
          style={{ background: activeTab === 'FUNDS' ? 'var(--accent-bolt)' : 'transparent', color: activeTab === 'FUNDS' ? '#fff' : 'var(--text-color)' }}
        >
          📊 펀드 & VOSPI
        </button>
      </div>

      {activeTab === 'BANK' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* DEPOSIT SECTION */}
          <div className="glass-panel">
            <h2>{txt.savingsAccount}</h2>
            <div className="flex-between" style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div className="text-muted">{txt.currentBalance}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  ⚡{user.deposit.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-muted">{txt.dailyInterest}</div>
                <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  +{(depositRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="number" className="glass-input" placeholder={txt.depositAmt} value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)} min="1"
              />
              <button type="submit" className="glass-button">{txt.depositBtn}</button>
            </form>

            <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" className="glass-input" placeholder={txt.withdrawAmt} value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} min="1"
              />
              <button type="submit" className="glass-button">{txt.withdrawBtn}</button>
            </form>
          </div>

          {/* LOAN SECTION */}
          <div className="glass-panel" style={{ borderColor: 'var(--danger)' }}>
            <h2>{txt.creditLine}</h2>
            <div className="flex-between" style={{ marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div className="text-muted">{txt.currentDebt}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  ⚡{user.loan.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-muted">{txt.dailyInterest}</div>
                <div className="text-danger" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  -{(loanRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
              {txt.availCredit}: ⚡{maxLoan.toLocaleString()}
            </div>

            <form onSubmit={handleLoan} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="number" className="glass-input" placeholder={txt.borrowAmt} value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)} min="1" disabled={maxLoan <= 0}
              />
              <button type="submit" className="glass-button" disabled={maxLoan <= 0}>{txt.borrowBtn}</button>
            </form>

            <form onSubmit={handleRepay} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" className="glass-input" placeholder={txt.repayAmt} value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)} min="1" disabled={user.loan === 0}
              />
              <button type="submit" className="glass-button" disabled={user.loan === 0}>{txt.repayBtn}</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'FUNDS' && (
        <div>
          <VOSPIChart data={vospiDailyHistory} initialPrice={vospiInitial} />

          {!isMarketOpen && (
            <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px', background: 'rgba(234, 179, 8, 0.1)', borderColor: 'var(--warning)', color: 'var(--warning)', textAlign: 'center' }}>
              Market is closed. Trading hours are 09:00 - 19:59.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* VOSPI Index Fund */}
            <div className="glass-panel" style={{ padding: '16px 24px', opacity: !isMarketOpen && !(user.portfolio['VOSPI'] > 0) ? 0.7 : 1 }}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                  <div style={{ width: '120px' }}>
                    <h3 style={{ margin: 0 }}>VOSPI 펀드</h3>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Index Fund</div>
                  </div>
                  
                  <div style={{ width: '120px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={vospiColor}>
                      ⚡{vospi.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem' }} className={vospiColor}>
                      {((vospiRatio - 1) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    {isMarketOpen && <IntradayChart intradayHistory={vospiIntradayHistory} />}
                  </div>

                  <div style={{ width: '100px', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.owned}</div>
                    <div style={{ fontWeight: 'bold' }}>{user.portfolio['VOSPI'] || 0}</div>
                  </div>
                </div>

                <div style={{ marginLeft: '24px', minWidth: '220px', display: 'flex', justifyContent: 'flex-end' }}>
                  {isMarketOpen ? (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" className="glass-input" style={{ width: '70px', padding: '8px' }} placeholder={txt.buy} value={buyVOSPI} onChange={(e) => setBuyVOSPI(e.target.value)} min="1" />
                        <button onClick={() => executeFundTrade('VOSPI', 'BUY', buyVOSPI, setBuyVOSPI)} className="glass-button" style={{ padding: '8px', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'var(--success)', color: 'var(--success)' }}>{txt.buy}</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" className="glass-input" style={{ width: '70px', padding: '8px' }} placeholder={txt.sell} value={sellVOSPI} onChange={(e) => setSellVOSPI(e.target.value)} min="1" disabled={!(user.portfolio['VOSPI'] > 0)} />
                        <button onClick={() => executeFundTrade('VOSPI', 'SELL', sellVOSPI, setSellVOSPI)} className="glass-button" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', color: 'var(--danger)' }} disabled={!(user.portfolio['VOSPI'] > 0)}>{txt.sell}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Change</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={vospiColor}>{((vospiRatio - 1) * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VOSPI Inverse Fund */}
            <div className="glass-panel" style={{ padding: '16px 24px', opacity: !isMarketOpen && !(user.portfolio['VOSPI_INV'] > 0) ? 0.7 : 1 }}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                  <div style={{ width: '120px' }}>
                    <h3 style={{ margin: 0 }}>인버스 펀드</h3>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Inverse (1x)</div>
                  </div>
                  
                  <div style={{ width: '120px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={invColor}>
                      ⚡{inversePrice.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem' }} className={invColor}>
                      {((invRatio - 1) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    {isMarketOpen && (
                      <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Inversely tracks VOSPI
                      </div>
                    )}
                  </div>

                  <div style={{ width: '100px', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{txt.owned}</div>
                    <div style={{ fontWeight: 'bold' }}>{user.portfolio['VOSPI_INV'] || 0}</div>
                  </div>
                </div>

                <div style={{ marginLeft: '24px', minWidth: '220px', display: 'flex', justifyContent: 'flex-end' }}>
                  {isMarketOpen ? (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" className="glass-input" style={{ width: '70px', padding: '8px' }} placeholder={txt.buy} value={buyINV} onChange={(e) => setBuyINV(e.target.value)} min="1" />
                        <button onClick={() => executeFundTrade('INV', 'BUY', buyINV, setBuyINV)} className="glass-button" style={{ padding: '8px', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'var(--success)', color: 'var(--success)' }}>{txt.buy}</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" className="glass-input" style={{ width: '70px', padding: '8px' }} placeholder={txt.sell} value={sellINV} onChange={(e) => setSellINV(e.target.value)} min="1" disabled={!(user.portfolio['VOSPI_INV'] > 0)} />
                        <button onClick={() => executeFundTrade('INV', 'SELL', sellINV, setSellINV)} className="glass-button" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)', color: 'var(--danger)' }} disabled={!(user.portfolio['VOSPI_INV'] > 0)}>{txt.sell}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>Daily Change</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className={invColor}>{((invRatio - 1) * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Bank;
