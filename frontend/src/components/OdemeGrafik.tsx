import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props { data: { odeme_durumu: string; adet: number; toplam_tutar: number }[] }

const LABEL: Record<string, string> = { odendi: 'Ödendi', bekliyor: 'Bekliyor', kismi: 'Kısmi' }
const RENK: Record<string, string> = { odendi: '#16a34a', bekliyor: '#dc2626', kismi: '#d97706' }

export default function OdemeGrafik({ data }: Props) {
  const chartData = data.map(d => ({ name: LABEL[d.odeme_durumu] || d.odeme_durumu, value: d.adet, color: RENK[d.odeme_durumu] || '#94a3b8' }))
  if (!chartData.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" nameKey="name" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
          {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v} adet`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
