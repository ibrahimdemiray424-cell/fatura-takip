import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api'

const fmt = (v: number) => v ? v.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'

export default function OdemeTakibi() {
  const [rows, setRows] = useState<any[]>([])
  const [odemeOzet, setOdemeOzet] = useState<any[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>({})

  const load = useCallback(() => {
    apiFetch('/api/faturalar?odeme_durumu=bekliyor').then(r => r.json()).then(a =>
      apiFetch('/api/faturalar?odeme_durumu=kismi').then(r => r.json()).then(b =>
        setRows([...a, ...b].sort((x, y) => (x.fatura_tarihi > y.fatura_tarihi ? -1 : 1)))
      )
    )
    apiFetch('/api/raporlar/odeme-ozet').then(r => r.json()).then(setOdemeOzet)
  }, [])

  useEffect(() => { load() }, [load])

  const handleOdendi = async (row: any) => {
    await apiFetch(`/api/faturalar/${row.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, odenen_tutar: row.genel_toplam, odeme_tarihi: new Date().toISOString().slice(0, 10) })
    })
    load()
  }

  const handleKaydet = async (row: any) => {
    await apiFetch(`/api/faturalar/${row.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, ...editData })
    })
    setEditId(null)
    load()
  }

  const bekleyenToplam = rows.reduce((s, r) => s + (r.genel_toplam - (r.odenen_tutar || 0)), 0)
  const odendi = odemeOzet.find(o => o.odeme_durumu === 'odendi')
  const tahsilEdilenToplam = odemeOzet.reduce((s, o) => s + (o.odenen_tutar || 0), 0)

  const inpStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, width: '100%' }

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Ödeme Takibi</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Bekleyen Tahsilat', value: fmt(bekleyenToplam), sub: `${rows.length} fatura`, color: '#dc2626' },
          { label: 'Ödendi (Adet)', value: String(odendi?.adet || 0), sub: fmt(odendi?.toplam_tutar || 0), color: '#16a34a' },
          { label: 'Toplam Tahsilat', value: fmt(tahsilEdilenToplam), sub: 'tüm ödemeler', color: '#2563eb' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderLeft: `4px solid ${c.color}` }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{c.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 2px', color: '#0f172a' }}>{c.value}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Fatura No','Tarih','Marka / Model','Müşteri','Dosya No','Genel Toplam','Ödenen','Eksik Tutar','Durum','Ödeme Tarihi','İşlem'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Bekleyen ödeme yok</td></tr>
              )}
              {rows.map((r, i) => {
                const eksik = r.genel_toplam - (r.odenen_tutar || 0)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}>{r.fatura_no || '-'}</td>
                    <td style={td}>{r.fatura_tarihi || '-'}</td>
                    <td style={td}>{[r.marka, r.model].filter(Boolean).join(' ') || '-'}</td>
                    <td style={td}>{r.musteri_adi || '-'}</td>
                    <td style={td}>{r.dosya_no || '-'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(r.genel_toplam)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#16a34a' }}>{fmt(r.odenen_tutar)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>{fmt(eksik)}</td>
                    <td style={td}>
                      <span style={{
                        background: r.odeme_durumu === 'kismi' ? '#fef9c3' : '#fee2e2',
                        color: r.odeme_durumu === 'kismi' ? '#854d0e' : '#991b1b',
                        padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600
                      }}>
                        {r.odeme_durumu === 'kismi' ? 'Kısmi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td style={{ ...td, minWidth: 130 }}>
                      {editId === r.id ? (
                        <input type="date" value={editData.odeme_tarihi || ''} onChange={e => setEditData((d: any) => ({ ...d, odeme_tarihi: e.target.value }))} style={inpStyle} />
                      ) : r.odeme_tarihi || '-'}
                    </td>
                    <td style={td}>
                      {editId === r.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" placeholder="Ödenen ₺" value={editData.odenen_tutar ?? ''} onChange={e => setEditData((d: any) => ({ ...d, odenen_tutar: Number(e.target.value) }))} style={{ ...inpStyle, width: 90 }} />
                          <button onClick={() => handleKaydet(r)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Kaydet</button>
                          <button onClick={() => setEditId(null)} style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>İptal</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditId(r.id); setEditData({ odeme_tarihi: r.odeme_tarihi || '', odenen_tutar: r.odenen_tutar || 0 }) }}
                            style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Güncelle</button>
                          <button onClick={() => handleOdendi(r)}
                            style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Ödendi</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const td: React.CSSProperties = { padding: '10px 14px', whiteSpace: 'nowrap' }
