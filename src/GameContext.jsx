import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const GameContext = createContext();

const INITIAL_FUNDS = 10000;
const DAY_IN_MS = 60000; // 1 minute
const TICK_MS = 1000; // 1 second
const TICKS_PER_DAY = 60;

// Initialize 26 stocks A-Z
const generateInitialStocks = () => {
  return Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    const initialPrice = Math.floor(Math.random() * 900) + 100; // 100 to 1000
    return {
      id: letter,
      name: `Corp ${letter}`,
      initialPrice,
      currentPrice: initialPrice,
      history: [initialPrice],
      dailyHistory: [{ day: 1, price: initialPrice }],
      isDelisted: false,
    };
  });
};

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { code: string, bolts: number, deposit: number, loan: number, portfolio: { [stockId]: number } }
  const [day, setDay] = useState(1);
  const [ticks, setTicks] = useState(0);
  const [stocks, setStocks] = useState(generateInitialStocks());
  
  const [depositRate, setDepositRate] = useState(0.02); // 2% daily
  const [loanRate, setLoanRate] = useState(0.05); // 5% daily
  
  const tickRef = useRef(ticks);
  tickRef.current = ticks;

  // Load from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('bg_user_code');
    if (savedCode) {
      const savedData = localStorage.getItem(`bg_user_${savedCode}`);
      if (savedData) {
        setUser(JSON.parse(savedData));
      } else {
        setUser({ code: savedCode, bolts: INITIAL_FUNDS, deposit: 0, loan: 0, portfolio: {} });
      }
    }
  }, []);

  // Save to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('bg_user_code', user.code);
      localStorage.setItem(`bg_user_${user.code}`, JSON.stringify(user));
    } else {
      localStorage.removeItem('bg_user_code');
    }
  }, [user]);

  // Main Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user) return; // Only run logic if logged in

      setTicks(t => {
        const newTicks = t + 1;
        
        // --- 1. STOCK MARKET UPDATE (Every Tick = 1s) ---
        setStocks(prevStocks => {
          return prevStocks.map(stock => {
            if (stock.isDelisted) return stock;

            // Random change between -50% and +50% of CURRENT price? 
            // Wait, instruction: "-50% ~ +50%까지 바뀌나, 시작 금액에서 멀어질 경우 회귀하게끔 확률 보정있음"
            // Let's make it -5% to +5% per second to not be too crazy, but occasional spikes.
            // Regression to mean:
            const ratioToInitial = stock.currentPrice / stock.initialPrice;
            // if ratio > 1 (higher than initial), higher chance to drop.
            const regressionForce = (1 - ratioToInitial) * 0.05; // Pulls towards initial
            
            // Random factor between -0.05 and +0.05
            const randomFactor = (Math.random() - 0.5) * 0.1; 
            
            let changePercent = randomFactor + regressionForce;
            
            // Cap max single tick change
            if (changePercent > 0.5) changePercent = 0.5;
            if (changePercent < -0.5) changePercent = -0.5;

            let newPrice = Math.floor(stock.currentPrice * (1 + changePercent));
            if (newPrice < 1) newPrice = 1;

            let isDelisted = false;
            // Delist if drops by 90% from initial (-90% => 0.1 * initial)
            if (newPrice <= stock.initialPrice * 0.1) {
              isDelisted = true;
              newPrice = 0;
            }

            const newDailyHistory = stock.dailyHistory ? [...stock.dailyHistory] : [{ day: 1, price: stock.initialPrice }];
            if (newTicks % TICKS_PER_DAY === 0) {
              newDailyHistory.push({ day: Math.floor(newTicks / TICKS_PER_DAY) + 1, price: newPrice });
            }

            return {
              ...stock,
              currentPrice: newPrice,
              history: [...stock.history.slice(-20), newPrice], // Keep last 20 ticks for sparkline
              dailyHistory: newDailyHistory,
              isDelisted
            };
          });
        });

        // --- 2. DAILY UPDATES (Every 60 Ticks = 1 min) ---
        if (newTicks % TICKS_PER_DAY === 0) {
          setDay(d => d + 1);
          
          setUser(prev => {
            if (!prev) return prev;
            // Apply deposit interest
            const depositInterest = Math.floor(prev.deposit * depositRate);
            // Apply loan interest (increases loan amount)
            const loanInterest = Math.floor(prev.loan * loanRate);
            
            return {
              ...prev,
              deposit: prev.deposit + depositInterest,
              loan: prev.loan + loanInterest
            };
          });
        }

        // --- 3. EVERY 3 DAYS UPDATE (Rates) ---
        if (newTicks % (TICKS_PER_DAY * 3) === 0) {
          // Recalculate Rates
          setStocks(currentStocks => {
            // Deposit Rate based on stock market health
            const activeStocks = currentStocks.filter(s => !s.isDelisted);
            let marketHealth = 1;
            if (activeStocks.length > 0) {
               const avgRatio = activeStocks.reduce((acc, s) => acc + (s.currentPrice / s.initialPrice), 0) / activeStocks.length;
               marketHealth = avgRatio;
            }
            
            // If health > 1 (boom), deposit rate goes up. Base 2%.
            const newDepositRate = 0.02 * marketHealth;
            setDepositRate(Math.min(Math.max(newDepositRate, 0.005), 0.1)); // 0.5% to 10%
            
            return currentStocks;
          });

          setUser(prev => {
            if (!prev) return prev;
            // Loan rate based on user net worth (simulating market money)
            const netWorth = prev.bolts + prev.deposit - prev.loan;
            // Base 5% + 1% per 100k
            const newLoanRate = 0.05 + Math.max(0, (netWorth / 100000) * 0.01);
            setLoanRate(Math.min(newLoanRate, 0.2)); // Cap at 20%
            return prev;
          });
        }

        return newTicks;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [user, depositRate, loanRate]);

  // Actions
  const login = (code) => {
    const savedData = localStorage.getItem(`bg_user_${code}`);
    if (savedData) {
      setUser(JSON.parse(savedData));
    } else {
      const newUser = { code, bolts: INITIAL_FUNDS, deposit: 0, loan: 0, portfolio: {} };
      setUser(newUser);
      localStorage.setItem(`bg_user_${code}`, JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  return (
    <GameContext.Provider value={{
      user, setUser, day, stocks, login, logout, generateCode, depositRate, loanRate
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
