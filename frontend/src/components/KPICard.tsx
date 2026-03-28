interface KPICardProps {
  title: string
  value: string
  sub?: string
  color?: string
}

export default function KPICard({ title, value, sub, color = '#2563eb' }: KPICardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#0f172a' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{sub}</p>}
    </div>
  )
}
