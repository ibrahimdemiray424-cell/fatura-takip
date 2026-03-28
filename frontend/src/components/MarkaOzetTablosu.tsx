const MARKA_RENK: Record<string, string> = { OPEL: '#eab308', PEUGEOT: '#1e3a8a', 'HYUNDAİ': '#2563eb', 'DİĞER': '#94a3b8' }

interface Row { marka: string; adet: number; yedek_parca: number; iscilik: number; toplam: number }
interface Props { data: Row[] }

const fmt = (v: number) => v ? Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'

export default function MarkaOzetTablosu({ data }: Props) {
  if (!data.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  const tAdet = data.reduce((s, r) => s + r.adet, 0)
  const tParca = data.reduce((s, r) => s + r.yedek_parca, 0)
  const tIscilik = data.reduce((s, r) => s + r.iscilik, 0)
  const tToplam = data.reduce((s, r) => s + r.toplam, 0)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {['Marka','Giriş Adedi','Yedek Parça','İşçilik','Genel Toplam'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Marka' ? 'left' : 'right', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.marka} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: MARKA_RENK[r.marka] ?? '#94a3b8', flexShrink: 0 }} />
                  <strong>{r.marka}</strong>
                </div>
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{r.adet} adet</td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(r.yedek_parca)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(r.iscilik)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{fmt(r.toplam)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
            <td style={{ padding: '10px 14px', fontWeight: 700 }}>TOPLAM</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{tAdet} adet</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{fmt(tParca)}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{fmt(tIscilik)}</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(tToplam)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
