import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Faturalar from './pages/Faturalar'
import OdemeTakibi from './pages/OdemeTakibi'
import Ekspertiz from './pages/Ekspertiz'
import EkspertizForm from './pages/EkspertizForm'
import EkspertizDetay from './pages/EkspertizDetay'
import Login from './pages/Login'
import { getToken, clearToken, getUsername } from './api'

const navGroup = (label: string) => (
  <div style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
)

const navItem = (to: string, icon: string, label: string, exact = false) => (
  <NavLink key={to} to={to} end={exact}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 8, fontSize: 13,
      textDecoration: 'none', transition: 'background 0.15s',
      background: isActive ? '#2563eb' : 'transparent',
      color: isActive ? '#fff' : '#94a3b8',
    })}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    {label}
  </NavLink>
)

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())
  const handleLogout = () => { clearToken(); setLoggedIn(false) }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 225, background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1e293b' }}>
            <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Hasar Onarım Merkezi</p>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 0', color: '#fff', letterSpacing: '-0.02em' }}>HASAR TAKİP</h1>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 10, flex: 1 }}>
            {navGroup('Fatura')}
            {navItem('/', '▦', 'Dashboard', true)}
            {navItem('/faturalar', '≡', 'Faturalar')}
            {navItem('/odeme-takibi', '₺', 'Ödeme Takibi')}
            {navGroup('Ekspertiz')}
            {navItem('/ekspertiz', '⚙', 'Ön Ekspertiz')}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px', fontWeight: 600 }}>{getUsername()}</p>
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
            <Route path="/ekspertiz" element={<Ekspertiz />} />
            <Route path="/ekspertiz/yeni" element={<EkspertizForm />} />
            <Route path="/ekspertiz/:id" element={<EkspertizDetay />} />
            <Route path="/ekspertiz/:id/duzenle" element={<EkspertizForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
