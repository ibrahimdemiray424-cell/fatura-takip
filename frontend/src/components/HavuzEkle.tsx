import { useState } from 'react'
import { apiFetch } from '../api'

interface Props {
  onEklendi: () => void
}

export default function HavuzEkle({ onEklendi }: Props) {
  const [mod, setMod] = useState<'tek' | 'toplu'>('tek')
  const [tekNo, setTekNo] = useState('')
  const [topluNolar, setTopluNolar] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tip: 'ok' | 'hata' | 'ozet'; text: string } | null>(null)

  const tekEkle = async () => {
    if (!tekNo.trim()) return
    setLoading(true); setMsg(null)
    try {
      const res = await apiFetch('/api/faturalar/havuz/ekle', {
        method: 'POST',
        body: JSON.stringify({ faturaNo: tekNo.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ tip: 'hata', text: data.error || 'Hata oluştu' }); return }
      setMsg({ tip: 'ok', text: `"${tekNo.trim()}" sisteme eklendi.` })
      setTekNo('')
      onEklendi()
    } catch { setMsg({ tip: 'hata', text: 'Sunucuya bağlanılamadı' }) }
    setLoading(false)
  }

  const topluEkle = async () => {
    const list = topluNolar.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (!list.length) return
    setLoading(true); setMsg(null)
    try {
      const res = await apiFetch('/api/faturalar/havuz/toplu-ekle', {
        method: 'POST',
        body: JSON.stringify({ faturaNoList: list })
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ tip: 'hata', text: data.error || 'Hata oluştu' }); return }
      let text = `${data.eklendi} fatura sisteme eklendi.`
      if (data.bulunamadi?.length) text += ` Bulunamayan: ${data.bulunamadi.join(', ')}`
      setMsg({ tip: data.bulunamadi?.length ? 'ozet' : 'ok', text })
      if (data.eklendi > 0) { setTopluNolar(''); onEklendi() }
    } catch { setMsg({ tip: 'hata', text: 'Sunucuya bağlanılamadı' }) }
    setLoading(false)
  }

  const renkMap = { ok: '#16a34a', hata: '#dc2626', ozet: '#d97706' }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Havuzdan Fatura Ekle</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {(['tek', 'toplu'] as const).map(m => (
            <button key={m} onClick={() => { setMod(m); setMsg(null) }} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: mod === m ? '#2563eb' : '#e2e8f0',
              color: mod === m ? '#fff' : '#374151', border: 'none'
            }}>
              {m === 'tek' ? 'Tek Fatura' : 'Toplu'}
            </button>
          ))}
        </div>
      </div>

      {mod === 'tek' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={tekNo}
            onChange={e => setTekNo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tekEkle()}
            placeholder="Fatura numarası girin..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none' }}
          />
          <button onClick={tekEkle} disabled={loading || !tekNo.trim()} style={{
            padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}>
            {loading ? '...' : 'Ekle'}
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={topluNolar}
            onChange={e => setTopluNolar(e.target.value)}
            placeholder={'Fatura numaralarını her satıra bir tane veya virgülle ayırarak yazın:\nFTR-2024-001\nFTR-2024-002, FTR-2024-003'}
            rows={4}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button onClick={topluEkle} disabled={loading || !topluNolar.trim()} style={{
            marginTop: 6, padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}>
            {loading ? 'Ekleniyor...' : 'Toplu Ekle'}
          </button>
        </div>
      )}

      {msg && (
        <div style={{ marginTop: 8, fontSize: 13, color: renkMap[msg.tip], fontWeight: 500 }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
