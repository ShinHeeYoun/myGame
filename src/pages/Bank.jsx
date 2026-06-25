import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

function Bank() {
  const { user, setUser, depositRate, loanRate, day, txt } = useGame();
  const navigate = useNavigate();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const netWorth = user.bolts + user.deposit - user.loan;
  const maxLoan = Math.max(0, Math.floor(netWorth * 0.5) - user.loan);

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = parseInt(depositAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.bolts) {
      setUser({
        ...user,
        bolts: user.bolts - amount,
        deposit: user.deposit + amount
      });
      setDepositAmount('');
    }
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.deposit) {
      setUser({
        ...user,
        bolts: user.bolts + amount,
        deposit: user.deposit - amount
      });
      setWithdrawAmount('');
    }
  };

  const handleLoan = (e) => {
    e.preventDefault();
    const amount = parseInt(loanAmount);
    if (!isNaN(amount) && amount > 0 && amount <= maxLoan) {
      setUser({
        ...user,
        bolts: user.bolts + amount,
        loan: user.loan + amount
      });
      setLoanAmount('');
    }
  };

  const handleRepay = (e) => {
    e.preventDefault();
    const amount = parseInt(repayAmount);
    if (!isNaN(amount) && amount > 0 && amount <= user.bolts) {
      const actualRepayment = Math.min(amount, user.loan);
      setUser({
        ...user,
        bolts: user.bolts - actualRepayment,
        loan: user.loan - actualRepayment
      });
      setRepayAmount('');
    }
  };

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/')} className="glass-button">{txt.back}</button>
          <div>
            <h1>{txt.bankHeader}</h1>
            <p className="text-muted">Day {day} • {txt.bankSub}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-muted">{txt.walletBalance}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-bolt)' }}>
            <span className="bolt-icon">⚡</span>{user.bolts.toLocaleString()}
          </div>
        </div>
      </header>

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
              type="number" 
              className="glass-input" 
              placeholder={txt.depositAmt} 
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="1" max={user.bolts}
            />
            <button type="submit" className="glass-button">{txt.depositBtn}</button>
          </form>

          <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              className="glass-input" 
              placeholder={txt.withdrawAmt} 
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="1" max={user.deposit}
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
              type="number" 
              className="glass-input" 
              placeholder={txt.borrowAmt} 
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              min="1" max={maxLoan === 0 ? 1 : maxLoan}
              disabled={maxLoan <= 0}
            />
            <button type="submit" className="glass-button" disabled={maxLoan <= 0}>{txt.borrowBtn}</button>
          </form>

          <form onSubmit={handleRepay} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              className="glass-input" 
              placeholder={txt.repayAmt} 
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              min="1" max={Math.min(user.bolts, user.loan) === 0 ? 1 : Math.min(user.bolts, user.loan)}
              disabled={user.loan === 0}
            />
            <button type="submit" className="glass-button" disabled={user.loan === 0}>{txt.repayBtn}</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Bank;
