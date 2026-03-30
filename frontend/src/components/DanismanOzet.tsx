import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

interface Ozet {
  danisman: string
  adet: number
  yedek_parca: number
  iscilik: number
  toplam: number
}

interface Props { yil: number; ay: number | null }

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export default function DanismanOzet({ yil, ay }: Props) {
  const [data, setData] = useState<Ozet[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ yil: String(yil) })
    if (ay) params.set('ay', String(ay))
    apiFetch(`/api/raporlar/danisman-ozet?${params}`).then(r => r.json()).then(setData)
  }, [yil, ay])

  if (!data.length) return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', color: '#94a3b8', textAlign: 'center' }}>
      Bu dönemde danışman verisi yok.
    </div>
  )

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Danışman', 'Giriş', 'Yedek Parça', 'İşçilik', 'Genel Toplam'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Danışman' ? 'left' : 'right', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{row.danisman}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.adet}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(row.yedek_parca)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(row.iscilik)}</td>
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
  )
}
