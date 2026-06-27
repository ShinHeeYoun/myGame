import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGame } from './GameContext'

import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Bank from './pages/Bank'
import StockMarket from './pages/StockMarket'
import Casino from './pages/Casino'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const { user } = useGame();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/stock" element={<StockMarket />} />
        <Route path="/casino" element={<Casino />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
