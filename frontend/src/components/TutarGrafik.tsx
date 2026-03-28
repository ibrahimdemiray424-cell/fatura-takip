import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props { data: { ay: string; yedek_parca: number; iscilik: number; toplam: number }[] }

export default function TutarGrafik({ data }: Props) {
  const chartData = data.map(d => ({
    ay: d.ay.slice(5) + '/' + d.ay.slice(0, 4),
    'Yedek Parça': Math.round(d.yedek_parca),
    'İşçilik': Math.round(d.iscilik),
  }))
  if (!chartData.length) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>Veri yok</p>
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 1000) + 'K'} />
        <Tooltip formatter={(v) => Number(v).toLocaleString('tr-TR') + ' ₺'} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Yedek Parça" fill="#2563eb" stackId="a" />
        <Bar dataKey="İşçilik" fill="#16a34a" stackId="a" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
