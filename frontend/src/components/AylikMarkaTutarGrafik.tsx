import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MARKA_RENK: Record<string, string> = { OPEL: '#eab308', PEUGEOT: '#1e3a8a', 'HYUNDAİ': '#2563eb', 'DİĞER': '#94a3b8' }
const YEDEK_RENKLER = ['#7c3aed', '#0891b2', '#db2777']

interface Row { ay: string; marka: string; yedek_parca: number; iscilik: number }
interface Props { data: Row[]; tip: 'yedek_parca' | 'iscilik' }

export default function AylikMarkaTutarGrafik({ data, tip }: Props) {
  if (!data.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  const aylar = [...new Set(data.map(d => d.ay))].sort()
  const markalar = [...new Set(data.map(d => d.marka))].filter(Boolean)
  const chartData = aylar.map(ay => {
    const row: Record<string, string | number> = { ay: ay.slice(5) + '/' + ay.slice(0, 4) }
    markalar.forEach(m => { row[m] = 0 })
    data.filter(d => d.ay === ay).forEach(d => { row[d.marka] = Math.round(tip === 'yedek_parca' ? d.yedek_parca : d.iscilik) })
    return row
  })
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 1000) + 'K'} />
        <Tooltip formatter={(v) => Number(v).toLocaleString('tr-TR') + ' ₺'} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {markalar.map((m, i) => (
          <Bar key={m} dataKey={m} fill={MARKA_RENK[m] ?? YEDEK_RENKLER[i % YEDEK_RENKLER.length]} radius={[3,3,0,0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
