import { useState } from 'react'
import { setToken } from '../api'

interface Props { onLogin: () => void }

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Giriş başarısız'); return }
      setToken(data.token, data.username)
      onLogin()
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#2563eb', borderRadius: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🔧</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Fatura Takip Sistemi</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: 16, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>KULLANICI ADI</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              required
              style={{ width: '100%', padding: '11px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>ŞİFRE</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              required
              style={{ width: '100%', padding: '11px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#1d4ed8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24 }}>
          Hasar Onarım Merkezi — Fatura Takip v1.0
        </p>
      </div>
    </div>
  )
}
