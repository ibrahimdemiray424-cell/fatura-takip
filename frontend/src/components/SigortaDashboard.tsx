import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiFetch } from '../api'
import { useEffect, useState } from 'react'

interface SigortaOzet {
  sigorta_sirketi: string
  adet: number
  yedek_parca: number
  iscilik: number
  toplam: number
}

interface Props {
  yil: number
  ay: number | null
}

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export default function SigortaDashboard({ yil, ay }: Props) {
  const [data, setData] = useState<SigortaOzet[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ yil: String(yil) })
    if (ay) params.set('ay', String(ay))
    apiFetch(`/api/raporlar/sigorta-ozet?${params}`).then(r => r.json()).then(setData)
  }, [yil, ay])

  if (!data.length) return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', color: '#94a3b8', textAlign: 'center' }}>
      Bu dönemde sigorta verisi yok.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Özet Tablo */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sigorta Şirketi Özeti</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Sigorta Şirketi', 'Giriş', 'Yedek Parça', 'İşçilik', 'Genel Toplam'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Sigorta Şirketi' ? 'left' : 'right', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{row.sigorta_sirketi}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>{row.adet}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>{fmt(row.yedek_parca)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>{fmt(row.iscilik)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(row.toplam)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td style={{ padding: '8px 12px', color: '#0f172a' }}>TOPLAM</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{data.reduce((s, r) => s + r.adet, 0)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(data.reduce((s, r) => s + r.yedek_parca, 0))}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(data.reduce((s, r) => s + r.iscilik, 0))}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2563eb' }}>{fmt(data.reduce((s, r) => s + r.toplam, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Grafik */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sigorta Şirketi Karşılaştırma</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="sigorta_sirketi" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend />
            <Bar dataKey="yedek_parca" name="Yedek Parça" fill="#2563eb" radius={[4,4,0,0]} />
            <Bar dataKey="iscilik" name="İşçilik" fill="#16a34a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
