import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGame } from './GameContext'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Bank from './pages/Bank'
import StockMarket from './pages/StockMarket'

function PrivateRoute({ children }) {
  const { user } = useGame();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/bank" element={<PrivateRoute><Bank /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute><StockMarket /></PrivateRoute>} />
    </Routes>
  )
}

export default App
