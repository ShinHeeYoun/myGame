import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { t } from './i18n';

const GameContext = createContext();

const INITIAL_FUNDS = 10000;
const TICK_MS = 1000; // 1 second

export const SPEED_MAP = {
  veryFast: 60,
  fast: 180,
  normal: 300,
  slow: 900
};

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
      intradayHistory: { 9: initialPrice },
      isDelisted: false,
    };
  });
};

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [day, setDay] = useState(1);
  const [ticks, setTicks] = useState(0);
  const [stocks, setStocks] = useState(generateInitialStocks());
  
  const [depositRate, setDepositRate] = useState(0.02);
  const [loanRate, setLoanRate] = useState(0.05);
  
  // Settings
  const [language, setLanguage] = useState(localStorage.getItem('bg_lang') || 'ko');
  const [speedStr, setSpeedStr] = useState(localStorage.getItem('bg_speed') || 'veryFast');

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

  // Save settings
  useEffect(() => {
    localStorage.setItem('bg_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('bg_speed', speedStr);
  }, [speedStr]);

  // Main Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user) return; // Only run logic if logged in

      const ticksPerDay = SPEED_MAP[speedStr];

      setTicks(tCount => {
        const newTicks = tCount + 1;
        
        // --- 1. STOCK MARKET UPDATE (Every Tick = 1s) ---
        setStocks(prevStocks => {
          return prevStocks.map(stock => {
            if (stock.isDelisted) return stock;

            const tickInDay = newTicks % ticksPerDay;
            const totalMinutes = Math.floor((tickInDay / ticksPerDay) * 24 * 60);
            const currentHour = Math.floor(totalMinutes / 60);
            const isMarketOpen = currentHour >= 9 && currentHour < 20;

            let newPrice = stock.currentPrice;
            let isDelisted = stock.isDelisted;

            if (isMarketOpen && !isDelisted) {
              const randomFactor = (Math.random() - 0.5) * 0.1; 
              let changePercent = randomFactor;
              
              if (changePercent > 0.5) changePercent = 0.5;
              if (changePercent < -0.5) changePercent = -0.5;

              newPrice = Math.floor(stock.currentPrice * (1 + changePercent));
              if (newPrice < 1) newPrice = 1;

              if (newPrice <= stock.initialPrice * 0.1) {
                isDelisted = true;
                newPrice = 0;
              }
            }

            const newDailyHistory = stock.dailyHistory ? [...stock.dailyHistory] : [{ day: 1, price: stock.initialPrice }];
            if (newTicks % ticksPerDay === 0) {
              newDailyHistory.push({ day: Math.floor(newTicks / ticksPerDay) + 1, price: newPrice });
            }

            const prevTickInDay = (newTicks - 1) % ticksPerDay;
            const prevTotalMinutes = Math.floor((prevTickInDay / ticksPerDay) * 24 * 60);
            const prevHour = Math.floor(prevTotalMinutes / 60);
            
            let newIntradayHistory = stock.intradayHistory ? { ...stock.intradayHistory } : {};
            if (newTicks % ticksPerDay === 1) {
               newIntradayHistory = {};
            }
            if (currentHour !== prevHour && currentHour >= 9 && currentHour <= 20) {
               newIntradayHistory[currentHour] = newPrice;
            }

            return {
              ...stock,
              currentPrice: newPrice,
              history: [...stock.history.slice(-20), newPrice],
              dailyHistory: newDailyHistory,
              intradayHistory: newIntradayHistory,
              isDelisted
            };
          });
        });

        // --- 2. DAILY UPDATES ---
        if (newTicks % ticksPerDay === 0) {
          setDay(d => d + 1);
          
          setUser(prev => {
            if (!prev) return prev;
            const depositInterest = Math.floor(prev.deposit * depositRate);
            const loanInterest = Math.floor(prev.loan * loanRate);
            return {
              ...prev,
              deposit: prev.deposit + depositInterest,
              loan: prev.loan + loanInterest
            };
          });
        }

        // --- 3. EVERY 3 DAYS UPDATE (Rates) ---
        if (newTicks % (ticksPerDay * 3) === 0) {
          setStocks(currentStocks => {
            const activeStocks = currentStocks.filter(s => !s.isDelisted);
            let marketHealth = 1;
            if (activeStocks.length > 0) {
               const avgRatio = activeStocks.reduce((acc, s) => acc + (s.currentPrice / s.initialPrice), 0) / activeStocks.length;
               marketHealth = avgRatio;
            }
            const newDepositRate = 0.02 * marketHealth;
            setDepositRate(Math.min(Math.max(newDepositRate, 0.005), 0.1)); 
            return currentStocks;
          });

          setUser(prev => {
            if (!prev) return prev;
            const netWorth = prev.bolts + prev.deposit - prev.loan;
            const newLoanRate = 0.05 + Math.max(0, (netWorth / 100000) * 0.01);
            setLoanRate(Math.min(newLoanRate, 0.2));
            return prev;
          });
        }

        return newTicks;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [user, depositRate, loanRate, speedStr]);

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

  const txt = t[language];

  // Calculate real-time 
  const ticksPerDay = SPEED_MAP[speedStr];
  const tickInDay = ticks % ticksPerDay;
  const dayProgressRatio = tickInDay / ticksPerDay;
  const totalMinutes = Math.floor(dayProgressRatio * 24 * 60);
  const currentHour = Math.floor(totalMinutes / 60);
  const hoursStr = currentHour.toString().padStart(2, '0');
  const minutesStr = (totalMinutes % 60).toString().padStart(2, '0');
  const timeStr = `${hoursStr}:${minutesStr}`;

  // VOSPI calculations
  const vospi = stocks.reduce((acc, s) => acc + s.currentPrice, 0);
  const vospiInitial = stocks.reduce((acc, s) => acc + s.initialPrice, 0);
  const inversePrice = Math.max(1, (vospiInitial * 2) - vospi);

  const getStockPrice = (stockId) => {
    if (stockId === 'VOSPI') return vospi;
    if (stockId === 'VOSPI_INV') return inversePrice;
    const stock = stocks.find(s => s.id === stockId);
    return stock ? stock.currentPrice : 0;
  };

  const userPortfolioValue = user ? Object.keys(user.portfolio).reduce((acc, stockId) => {
    return acc + (user.portfolio[stockId] * getStockPrice(stockId));
  }, 0) : 0;

  return (
    <GameContext.Provider value={{
      user, setUser, day, timeStr, currentHour, dayProgressRatio, stocks, login, logout, generateCode, depositRate, loanRate,
      language, setLanguage, speedStr, setSpeedStr, txt,
      vospi, vospiInitial, inversePrice, getStockPrice, userPortfolioValue
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
