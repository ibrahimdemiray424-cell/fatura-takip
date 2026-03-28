import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { ay: string; ciro: number }[] }

export default function CiroGrafik({ data }: Props) {
  const chartData = data.map(d => ({ ay: d.ay.slice(5) + '/' + d.ay.slice(0, 4), 'Ciro (₺)': Math.round(d.ciro) }))
  if (!chartData.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 1000) + 'K'} />
        <Tooltip formatter={(v) => Number(v).toLocaleString('tr-TR') + ' ₺'} />
        <Line type="monotone" dataKey="Ciro (₺)" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
