import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#eab308','#1e3a8a','#2563eb','#94a3b8','#16a34a','#dc2626','#7c3aed','#0891b2']

interface Props { data: { ay: string; marka: string; adet: number }[] }

export default function MarkaGrafik({ data }: Props) {
  const aylar = [...new Set(data.map(d => d.ay))].sort()
  const markalar = [...new Set(data.map(d => d.marka))].filter(Boolean)
  const chartData = aylar.map(ay => {
    const obj: Record<string, string | number> = { ay: ay.slice(5) + '/' + ay.slice(0, 4) }
    markalar.forEach(m => { obj[m] = 0 })
    data.filter(d => d.ay === ay).forEach(d => { obj[d.marka] = d.adet })
    return obj
  })
  if (!chartData.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {markalar.map((m, i) => <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} radius={[3,3,0,0]} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}
