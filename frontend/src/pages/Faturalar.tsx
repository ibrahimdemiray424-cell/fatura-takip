import { useEffect, useState, useCallback } from 'react'
import FaturaForm from '../components/FaturaForm'
import ExcelImport from '../components/ExcelImport'
import HavuzEkle from '../components/HavuzEkle'
import { apiFetch } from '../api'

const MARKALAR = ['OPEL', 'PEUGEOT', 'HYUNDAİ', 'DİĞER']

const DURUM_STYLE: Record<string, React.CSSProperties> = {
  odendi: { background: '#dcfce7', color: '#166534' },
  bekliyor: { background: '#fee2e2', color: '#991b1b' },
  kismi: { background: '#fef9c3', color: '#854d0e' },
}
const DURUM_LABEL: Record<string, string> = { odendi: 'Ödendi', bekliyor: 'Bekliyor', kismi: 'Kısmi' }

const fmt = (v: number) => v ? v.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '-'

export default function Faturalar() {
  const [rows, setRows] = useState<any[]>([])
  const [filtreMarka, setFiltreMarka] = useState('')
  const [filtreDurum, setFiltreDurum] = useState('')
  const [filtreBaslangic, setFiltreBaslangic] = useState('')
  const [filtreBitis, setFiltreBitis] = useState('')
  const [arama, setArama] = useState('')
  const [aramaInput, setAramaInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (filtreMarka) params.set('marka', filtreMarka)
    if (filtreDurum) params.set('odeme_durumu', filtreDurum)
    if (filtreBaslangic) params.set('tarih_baslangic', filtreBaslangic)
    if (filtreBitis) params.set('tarih_bitis', filtreBitis)
    if (arama) params.set('arama', arama)
    apiFetch('/api/faturalar?' + params).then(r => r.json()).then(setRows)
  }, [filtreMarka, filtreDurum, filtreBaslangic, filtreBitis, arama])

  useEffect(() => { load(); setPage(1) }, [load])

  const handleArama = (e: React.FormEvent) => {
    e.preventDefault()
    setArama(aramaInput.trim())
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await apiFetch(`/api/faturalar/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    load()
  }

  const temizle = () => {
    setFiltreMarka(''); setFiltreDurum(''); setFiltreBaslangic('')
    setFiltreBitis(''); setArama(''); setAramaInput('')
  }

  const paged = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(rows.length / PER_PAGE)

  const inpStyle: React.CSSProperties = { padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          Faturalar <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>({rows.length} kayıt)</span>
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExcelImport onImport={load} />
          <HavuzEkle onEklendi={load} />
          <button onClick={() => { setEditRow(null); setShowForm(true) }}
            style={{ padding: '9px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + Yeni Fatura
          </button>
        </div>
      </div>

      <form onSubmit={handleArama} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={aramaInput}
          onChange={e => setAramaInput(e.target.value)}
          placeholder="Dosya No veya Plaka ile ara..."
          style={{ ...inpStyle, width: 280 }}
        />
        <button type="submit" style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Ara</button>
        {arama && <button type="button" onClick={() => { setArama(''); setAramaInput('') }} style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>✕</button>}
      </form>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filtreMarka} onChange={e => setFiltreMarka(e.target.value)} style={inpStyle}>
          <option value="">Tüm Markalar</option>
          {MARKALAR.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtreDurum} onChange={e => setFiltreDurum(e.target.value)} style={inpStyle}>
          <option value="">Tüm Durumlar</option>
          <option value="bekliyor">Bekliyor</option>
          <option value="odendi">Ödendi</option>
          <option value="kismi">Kısmi</option>
        </select>
        <input type="date" value={filtreBaslangic} onChange={e => setFiltreBaslangic(e.target.value)} style={inpStyle} />
        <input type="date" value={filtreBitis} onChange={e => setFiltreBitis(e.target.value)} style={inpStyle} />
        {(filtreMarka || filtreDurum || filtreBaslangic || filtreBitis || arama) && (
          <button onClick={temizle} style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
            Tümünü Temizle
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Fatura No','Tarih','Marka','Plaka','Müşteri','Dosya No','Yedek Parça','İşçilik','Genel Toplam','Durum','İşlem'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Kayıt bulunamadı</td></tr>
              )}
              {paged.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={td}>{r.fatura_no || '-'}</td>
                  <td style={td}>{r.fatura_tarihi || '-'}</td>
                  <td style={td}><strong>{r.marka || '-'}</strong></td>
                  <td style={td}>{r.plaka || '-'}</td>
                  <td style={td}>{r.musteri_adi || '-'}</td>
                  <td style={td}>{r.dosya_no || '-'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(r.yedek_parca_net)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(r.iscilik_net)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(r.genel_toplam)}</td>
                  <td style={td}>
                    <span style={{ ...DURUM_STYLE[r.odeme_durumu], padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                      {DURUM_LABEL[r.odeme_durumu] || r.odeme_durumu}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditRow(r); setShowForm(true) }}
                        style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Düzenle</button>
                      <button onClick={() => setDeleteId(r.id)}
                        style={{ padding: '4px 10px', border: '1px solid #fee2e2', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: 14, borderTop: '1px solid #f1f5f9' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pgBtn}>‹ Önceki</button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: '#64748b' }}>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pgBtn}>Sonraki ›</button>
          </div>
        )}
      </div>

      {showForm && (
        <FaturaForm initial={editRow} onSave={() => { setShowForm(false); load() }} onClose={() => setShowForm(false)} />
      )}

      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 340, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Faturayı sil?</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>İptal</button>
              <button onClick={handleDelete} style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const td: React.CSSProperties = { padding: '10px 14px', whiteSpace: 'nowrap' }
const pgBtn: React.CSSProperties = { padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }
