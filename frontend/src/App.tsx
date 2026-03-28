import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Faturalar from './pages/Faturalar'
import OdemeTakibi from './pages/OdemeTakibi'
import Login from './pages/Login'
import { getToken, clearToken, getUsername } from './api'

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())

  const handleLogout = () => { clearToken(); setLoggedIn(false) }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 220, background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1e293b' }}>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Hasar Onarım</p>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 0', color: '#fff' }}>Fatura Takip</h1>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, flex: 1 }}>
            {[
              { to: '/', label: 'Dashboard', icon: '▦' },
              { to: '/faturalar', label: 'Faturalar', icon: '≡' },
              { to: '/odeme-takibi', label: 'Ödeme Takibi', icon: '₺' },
            ].map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, fontSize: 14,
                  textDecoration: 'none', transition: 'background 0.15s',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                })}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', fontWeight: 600 }}>{getUsername()}</p>
            <button onClick={handleLogout} style={{ width: '100%', padding: '7px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
              Çıkış Yap
            </button>
          </div>
        </aside>
        <main style={{ flex: 1, overflow: 'auto', background: '#f1f5f9' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/faturalar" element={<Faturalar />} />
            <Route path="/odeme-takibi" element={<OdemeTakibi />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
