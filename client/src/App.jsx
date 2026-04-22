import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage   from './components/LandingPage';
import AuthPage      from './components/AuthPage';
import HomeView      from './components/HomeView';
import BoardView     from './components/BoardView';
import AccountPage   from './components/AccountPage';
import SettingsPage  from './components/SettingsPage';

// ── Auth context ──────────────────────────────────────
export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_user')) || null; }
    catch { return null; }
  });

  const login  = (u) => { setUser(u); localStorage.setItem('mb_user', JSON.stringify(u)); };
  const logout = ()  => { setUser(null); localStorage.removeItem('mb_user'); };
  const update = (u) => { const merged = { ...user, ...u }; setUser(merged); localStorage.setItem('mb_user', JSON.stringify(merged)); };

  return <AuthCtx.Provider value={{ user, login, logout, update }}>{children}</AuthCtx.Provider>;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<AuthPage mode="login" />} />
        <Route path="/register"  element={<AuthPage mode="register" />} />
        <Route path="/my-boards" element={<PrivateRoute><HomeView /></PrivateRoute>} />
        <Route path="/board/:id" element={<PrivateRoute><BoardView /></PrivateRoute>} />
        <Route path="/account"   element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
