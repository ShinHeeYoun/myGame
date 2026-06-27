# Money Game üí∏

A web-based simulation game where players can trade stocks, manage bank loans and deposits, and grow their wealth over time. 

## ‚ú® Key Features & Recent Updates

### 1. Advanced Stock Market System üìà
- **Trading Hours:** The market is only open from `09:00` to `19:59` game time.
- **Real-time Timeline Bar:** A smooth visual indicator showing the current time and active trading window.
- **Double-click Trading:** Double-clicking "Buy" or "Sell" when empty will auto-fill the maximum quantity and execute the trade rapidly.
- **Chart Interactions:** Double-clicking the fixed right-side chart will instantly sell all your shares of that stock.
- **Intraday Charts:** The market list now displays live sparkline charts mapping stock prices specifically during the 9 to 20 hour window.
- **Pure Random Walk:** Stock prices move naturally without artificial mean-reversion, simulating a truly volatile market.

### 2. Smart Banking & Assets üè¶
- **Auto-capping Inputs:** Inputting values larger than your capacity (e.g., trying to deposit more cash than you have) will instantly auto-correct to the maximum allowed amount.
- **Dashboard Asset Tracking:** The main dashboard automatically calculates your **Total Assets** (Cash + Deposits - Loans + Portfolio Value).

### 3. Global Layout & UI/UX üé®
- **Sticky Header:** The player's cash balance (`bolts`) and the real-time game clock are persistently visible across all pages.
- **Glassmorphism Design:** A modern, sleek UI using glass-panel aesthetics.

---

*This project is built with React, Vite, and Recharts.*

## ?? Code Structure (Modularized)

The codebase has been refactored for high maintainability and modularity:

```text
src/
 ¶≤ components/
 ¶≠ ¶≤ ui/                  # Reusable UI components (e.g., BetButton, Card)
 ¶≠ ¶≤ casino/              # Casino-specific game modules (Blackjack, Slots)
 ¶≠ ¶± stock/               # Stock market charts and UI modules
 ¶≤ pages/                 # Container pages (Casino, StockMarket, Bank, etc.)
 ¶± utils/                 # Pure business logic and helper functions (e.g., cards.js)
```
