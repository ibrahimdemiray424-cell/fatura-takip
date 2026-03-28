import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MARKA_RENK: Record<string, string> = { OPEL: '#eab308', PEUGEOT: '#1e3a8a', 'HYUNDAİ': '#2563eb', 'DİĞER': '#94a3b8' }

interface Row { marka: string; yedek_parca: number; iscilik: number; toplam: number }
interface Props { data: Row[] }

export default function MarkaTutarGrafik({ data }: Props) {
  if (!data.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  const markalar = data.map(d => d.marka)
  const chartData = [
    { name: 'Yedek Parça', ...Object.fromEntries(data.map(d => [d.marka, Math.round(d.yedek_parca)])) },
    { name: 'İşçilik',     ...Object.fromEntries(data.map(d => [d.marka, Math.round(d.iscilik)])) },
  ]
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 1000) + 'K'} />
        <Tooltip formatter={(v) => Number(v).toLocaleString('tr-TR') + ' ₺'} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {markalar.map(m => <Bar key={m} dataKey={m} fill={MARKA_RENK[m] ?? '#94a3b8'} radius={[3,3,0,0]} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}
