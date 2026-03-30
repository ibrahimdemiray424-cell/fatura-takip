import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import MarkaGrafik from '../components/MarkaGrafik'
import TutarGrafik from '../components/TutarGrafik'
import OdemeGrafik from '../components/OdemeGrafik'
import CiroGrafik from '../components/CiroGrafik'
import MarkaTutarGrafik from '../components/MarkaTutarGrafik'
import AylikMarkaTutarGrafik from '../components/AylikMarkaTutarGrafik'
import MarkaOzetTablosu from '../components/MarkaOzetTablosu'
import SigortaDashboard from '../components/SigortaDashboard'
import { apiFetch } from '../api'

const AYLAR = [
  { val: '', label: 'Tüm Yıl' },
  { val: '01', label: 'Ocak' }, { val: '02', label: 'Şubat' }, { val: '03', label: 'Mart' },
  { val: '04', label: 'Nisan' }, { val: '05', label: 'Mayıs' }, { val: '06', label: 'Haziran' },
  { val: '07', label: 'Temmuz' }, { val: '08', label: 'Ağustos' }, { val: '09', label: 'Eylül' },
  { val: '10', label: 'Ekim' }, { val: '11', label: 'Kasım' }, { val: '12', label: 'Aralık' },
]

const fmt = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

const DURUM_STYLE: Record<string, React.CSSProperties> = {
  bekliyor: { background: '#fee2e2', color: '#991b1b' },
  kismi: { background: '#fef9c3', color: '#854d0e' },
}
const DURUM_LABEL: Record<string, string> = { bekliyor: 'Bekliyor', kismi: 'Kısmi' }

const Kart = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
    <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h3>
    {children}
  </div>
)

export default function Dashboard() {
  const yilSu = new Date().getFullYear()
  const aySu = String(new Date().getMonth() + 1).padStart(2, '0')
  const [yil, setYil] = useState(yilSu)
  const [ay, setAy] = useState(aySu)
  const [kpi, setKpi] = useState<any>(null)
  const [aylikMarka, setAylikMarka] = useState([])
  const [aylikTutar, setAylikTutar] = useState([])
  const [odemeOzet, setOdemeOzet] = useState([])
  const [ciroTrendi, setCiroTrendi] = useState([])
  const [eksikOdemeler, setEksikOdemeler] = useState<any[]>([])
  const [markaTutarlar, setMarkaTutarlar] = useState([])
  const [aylikMarkaTutarlar, setAylikMarkaTutarlar] = useState([])

  const q = `yil=${yil}${ay ? `&ay=${ay}` : ''}`

  useEffect(() => {
    apiFetch(`/api/raporlar/kpi?${q}`).then(r => r.json()).then(setKpi)
    apiFetch(`/api/raporlar/odeme-ozet?${q}`).then(r => r.json()).then(setOdemeOzet)
    apiFetch(`/api/raporlar/aylik-marka?${q}`).then(r => r.json()).then(setAylikMarka)
    apiFetch(`/api/raporlar/aylik-tutarlar?${q}`).then(r => r.json()).then(setAylikTutar)
    apiFetch(`/api/raporlar/ciro-trendi?${q}`).then(r => r.json()).then(setCiroTrendi)
    apiFetch(`/api/raporlar/marka-tutarlar?${q}`).then(r => r.json()).then(setMarkaTutarlar)
    apiFetch(`/api/raporlar/aylik-marka-tutarlar?${q}`).then(r => r.json()).then(setAylikMarkaTutarlar)
    apiFetch('/api/raporlar/eksik-odemeler').then(r => r.json()).then(setEksikOdemeler)
  }, [yil, ay])

  const donemLabel = ay ? `${AYLAR.find(a => a.val === ay)?.label} ${yil}` : `${yil} Yılı`

  return (
    <div style={{ padding: 28 }}>
      {/* Başlık & filtreler */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Dashboard</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{donemLabel} özeti</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={yil} onChange={e => setYil(Number(e.target.value))} style={selStyle}>
            {[yilSu - 2, yilSu - 1, yilSu, yilSu + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={ay} onChange={e => setAy(e.target.value)} style={selStyle}>
            {AYLAR.map(a => <option key={a.val} value={a.val}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard title={`${donemLabel} Giriş`} value={kpi ? String(kpi.buAyGiris) : '-'} sub="araç" color="#2563eb" />
        <KPICard title={`${donemLabel} Ciro`} value={kpi ? fmt(kpi.buAyCiro) : '-'} sub="genel toplam" color="#16a34a" />
        <KPICard title="Bekleyen Tahsilat" value={kpi ? fmt(kpi.bekleyenTahsilat) : '-'} sub="tüm zamanlar" color="#dc2626" />
        <KPICard title="Toplam Ciro" value={kpi ? fmt(kpi.toplamCiro) : '-'} sub="tüm zamanlar" color="#7c3aed" />
        <KPICard title={`${donemLabel} Yedek Parça`} value={kpi ? fmt(kpi.buAyParca) : '-'} sub="" color="#eab308" />
        <KPICard title={`${donemLabel} İşçilik`} value={kpi ? fmt(kpi.buAyIscilik) : '-'} sub="" color="#1e3a8a" />
      </div>

      {/* Marka Özet Tablosu — ana vurgu */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Marka Bazında Özet
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: '#64748b' }}>{donemLabel}</span>
        </h3>
        <MarkaOzetTablosu data={markaTutarlar} />
      </div>

      {/* Grafikler — 2 kolon */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Kart title={`Aylık Marka Girişleri — ${yil}`}><MarkaGrafik data={aylikMarka} /></Kart>
        <Kart title={`Aylık Ciro Trendi — ${yil}`}><CiroGrafik data={ciroTrendi} /></Kart>
        <Kart title={`Aylık Yedek Parça + İşçilik — ${yil}`}><TutarGrafik data={aylikTutar} /></Kart>
        <Kart title="Ödeme Durum Dağılımı"><OdemeGrafik data={odemeOzet} /></Kart>
      </div>

      {/* Marka kırılım grafikleri */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Kart title="Marka — Parça + İşçilik Toplamı"><MarkaTutarGrafik data={markaTutarlar} /></Kart>
        <Kart title="Aylık Yedek Parça — Marka"><AylikMarkaTutarGrafik data={aylikMarkaTutarlar} tip="yedek_parca" /></Kart>
        <Kart title="Aylık İşçilik — Marka"><AylikMarkaTutarGrafik data={aylikMarkaTutarlar} tip="iscilik" /></Kart>
      </div>

      {/* Eksik ödemeler */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#374151' }}>
          Eksik Ödemeli Dosyalar
          <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>en yüksek 10 kayıt</span>
        </h3>
        {eksikOdemeler.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Bekleyen ödeme yok</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Dosya No','Fatura No','Müşteri','Marka','Plaka','Tarih','Genel Toplam','Ödenen','Eksik Tutar','Durum'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eksikOdemeler.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={td}><strong>{r.dosya_no || '-'}</strong></td>
                    <td style={td}>{r.fatura_no || '-'}</td>
                    <td style={td}>{r.musteri_adi || '-'}</td>
                    <td style={td}>{r.marka || '-'}</td>
                    <td style={td}>{r.plaka || '-'}</td>
                    <td style={td}>{r.fatura_tarihi || '-'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(r.genel_toplam)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#16a34a' }}>{r.odenen_tutar ? fmt(r.odenen_tutar) : '-'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(r.eksik_tutar)}</td>
                    <td style={td}>
                      <span style={{ ...(DURUM_STYLE[r.odeme_durumu] || {}), padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {DURUM_LABEL[r.odeme_durumu] || r.odeme_durumu}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sigorta Şirketi Dashboard */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Sigorta Şirketi Bazında Özet
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: '#64748b' }}>{donemLabel}</span>
        </h3>
        <SigortaDashboard yil={yil} ay={ay ? Number(ay) : null} />
      </div>
    </div>
  )
}

const selStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 14, background: '#fff', cursor: 'pointer' }
const td: React.CSSProperties = { padding: '9px 12px', whiteSpace: 'nowrap' }
