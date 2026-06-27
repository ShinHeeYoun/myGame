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
      intradayHistory: { 6: initialPrice },
      isDelisted: false,
    };
  });
};

function simulateCatchUp(parsed, elapsedTicks, ticksPerDay) {
  let { stocks, day, ticks, depositRate, loanRate } = parsed;
  let mStocks = JSON.parse(JSON.stringify(stocks));
  
  for (let i = 0; i < elapsedTicks; i++) {
    ticks++;
    const tickInDay = ticks % ticksPerDay;
    const totalMinutes = Math.floor((tickInDay / ticksPerDay) * 24 * 60);
    const currentHour = Math.floor(totalMinutes / 60);
    const isMarketOpen = currentHour >= 6 && currentHour < 24;

    const prevTickInDay = (ticks - 1) % ticksPerDay;
    const prevTotalMinutes = Math.floor((prevTickInDay / ticksPerDay) * 24 * 60);
    const prevHour = Math.floor(prevTotalMinutes / 60);

    for (let s of mStocks) {
      if (s.isDelisted) continue;

      if (isMarketOpen) {
        const logChange = (Math.random() - 0.5) * 0.1;
        const multiplier = Math.exp(logChange);
        s.currentPrice = Math.round(s.currentPrice * multiplier);
        if (s.currentPrice === s.history[s.history.length-1]) { 
          s.currentPrice += (Math.random() > 0.5 ? 1 : -1);
        }
        if (s.currentPrice < 1) s.currentPrice = 1;
        if (s.currentPrice <= s.initialPrice * 0.1) {
          s.isDelisted = true;
          s.currentPrice = 0;
        }
      }

      s.history.push(s.currentPrice);
      if (s.history.length > 20) s.history.shift();

      if (ticks % ticksPerDay === 0) {
        if (!s.dailyHistory) s.dailyHistory = [];
        s.dailyHistory.push({ day: Math.floor(ticks / ticksPerDay) + 1, price: s.currentPrice });
      }

      if (ticks % ticksPerDay === 1) {
        s.intradayHistory = {};
      }
      if (currentHour !== prevHour && currentHour >= 6 && currentHour <= 24) {
        if(!s.intradayHistory) s.intradayHistory = {};
        s.intradayHistory[currentHour] = s.currentPrice;
      }
    }

    if (ticks % ticksPerDay === 0) {
      day++;
    }

    if (ticks % (ticksPerDay * 3) === 0) {
      const activeStocks = mStocks.filter(s => !s.isDelisted);
      let marketHealth = 1;
      if (activeStocks.length > 0) {
         marketHealth = activeStocks.reduce((acc, s) => acc + (s.currentPrice / s.initialPrice), 0) / activeStocks.length;
      }
      depositRate = Math.min(Math.max(0.02 * marketHealth, 0.005), 0.1);
    }
  }

  return { stocks: mStocks, day, ticks, depositRate, loanRate, lastUpdate: Date.now() };
}

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [language, setLanguage] = useState(localStorage.getItem('bg_lang') || 'ko');
  const [speedStr, setSpeedStr] = useState(localStorage.getItem('bg_speed') || 'veryFast');
  
  const [day, setDay] = useState(1);
  const [ticks, setTicks] = useState(0);
  const [stocks, setStocks] = useState([]);
  const [depositRate, setDepositRate] = useState(0.02);
  const [loanRate, setLoanRate] = useState(0.05);

  const [initialized, setInitialized] = useState(false);

  // Load and catch-up global state
  useEffect(() => {
    const savedGlobal = localStorage.getItem('bg_global_state');
    const ticksPerDay = SPEED_MAP[speedStr] || 60;
    let finalState;

    if (savedGlobal) {
      const parsed = JSON.parse(savedGlobal);
      // Compatibility fallback
      if(!parsed.stocks) parsed.stocks = generateInitialStocks();
      if(!parsed.day) parsed.day = 1;
      if(!parsed.ticks) parsed.ticks = 0;
      if(!parsed.depositRate) parsed.depositRate = 0.02;
      if(!parsed.loanRate) parsed.loanRate = 0.05;

      const now = Date.now();
      const elapsedTicks = Math.min(Math.floor((now - (parsed.lastUpdate || now)) / TICK_MS), 2592000); 
      
      if (elapsedTicks > 0) {
        finalState = simulateCatchUp(parsed, elapsedTicks, ticksPerDay);
      } else {
        finalState = { ...parsed, lastUpdate: now };
      }
    } else {
      finalState = {
        stocks: generateInitialStocks(),
        day: 1,
        ticks: 0,
        depositRate: 0.02,
        loanRate: 0.05,
        lastUpdate: Date.now()
      };
    }

    setStocks(finalState.stocks);
    setDay(finalState.day);
    setTicks(finalState.ticks);
    setDepositRate(finalState.depositRate);
    setLoanRate(finalState.loanRate);
    setInitialized(true);

    // Initial Login Catchup
    const savedCode = localStorage.getItem('bg_user_code');
    if (savedCode) {
      const savedData = localStorage.getItem(`bg_user_${savedCode}`);
      if (savedData) {
        let userData = JSON.parse(savedData);
        if (userData.lastTick !== undefined && finalState.ticks > userData.lastTick) {
            let missedDays = 0;
            for(let t = userData.lastTick + 1; t <= finalState.ticks; t++) {
                if (t % ticksPerDay === 0) missedDays++;
            }
            if (missedDays > 0) {
                let newDeposit = userData.deposit || 0;
                let newLoan = userData.loan || 0;
                for (let i = 0; i < missedDays; i++) {
                    newDeposit += Math.floor(newDeposit * finalState.depositRate);
                    newLoan += Math.floor(newLoan * finalState.loanRate);
                }
                userData.deposit = newDeposit;
                userData.loan = newLoan;
            }
        }
        userData.lastTick = finalState.ticks;
        if (userData.coins === undefined) userData.coins = 0;
        setUser(userData);
      } else {
        setUser({ code: savedCode, bolts: INITIAL_FUNDS, deposit: 0, loan: 0, portfolio: {}, coins: 0, lastTick: finalState.ticks, loanPrincipal: 0, creditLimitBonus: 0 });
      }
    }
  }, []); // Only on mount

  // Save user when changed (and we continuously update lastTick)
  useEffect(() => {
    if (user) {
      localStorage.setItem('bg_user_code', user.code);
      localStorage.setItem(`bg_user_${user.code}`, JSON.stringify(user));
    } else {
      localStorage.removeItem('bg_user_code');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bg_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('bg_speed', speedStr);
  }, [speedStr]);

  // Main Game Loop
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
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
            const isMarketOpen = currentHour >= 6 && currentHour < 24;

            let newPrice = stock.currentPrice;
            let isDelisted = stock.isDelisted;

            if (isMarketOpen && !isDelisted) {
              const logChange = (Math.random() - 0.5) * 0.1; // ±5% volatility
              const multiplier = Math.exp(logChange);
              
              newPrice = Math.round(stock.currentPrice * multiplier);
              
              if (newPrice === stock.currentPrice) {
                newPrice += (Math.random() > 0.5 ? 1 : -1);
              }

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
            if (currentHour !== prevHour && currentHour >= 6 && currentHour <= 24) {
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
              loan: prev.loan + loanInterest,
              lastTick: newTicks
            };
          });
        } else {
          // Constantly update lastTick for user to ensure accurate save state
          setUser(prev => {
            if (!prev) return prev;
            return { ...prev, lastTick: newTicks };
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
  }, [initialized, depositRate, loanRate, speedStr]);

  // Continuously save global state every tick
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('bg_global_state', JSON.stringify({
        stocks, day, ticks, depositRate, loanRate, lastUpdate: Date.now()
      }));
    }
  }, [stocks, day, ticks, depositRate, loanRate, initialized]);

  // Actions
  const login = (code) => {
    const savedData = localStorage.getItem(`bg_user_${code}`);
    if (savedData) {
      let userData = JSON.parse(savedData);
      const ticksPerDay = SPEED_MAP[speedStr];
      if (userData.lastTick !== undefined && ticks > userData.lastTick) {
          let missedDays = 0;
          for(let t = userData.lastTick + 1; t <= ticks; t++) {
              if (t % ticksPerDay === 0) missedDays++;
          }
          if (missedDays > 0) {
              let newDeposit = userData.deposit || 0;
              let newLoan = userData.loan || 0;
              for (let i = 0; i < missedDays; i++) {
                  newDeposit += Math.floor(newDeposit * depositRate);
                  newLoan += Math.floor(newLoan * loanRate);
              }
              userData.deposit = newDeposit;
              userData.loan = newLoan;
          }
      }
      userData.lastTick = ticks;
      if (userData.coins === undefined) userData.coins = 0;
      setUser(userData);
    } else {
      const newUser = { code, bolts: INITIAL_FUNDS, deposit: 0, loan: 0, portfolio: {}, coins: 0, lastTick: ticks };
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
  const ticksPerDay = SPEED_MAP[speedStr] || 60;
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

  if (!initialized) return null; // Prevent rendering before catchup is done

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
