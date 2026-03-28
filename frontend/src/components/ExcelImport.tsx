import { useState } from 'react'
import * as XLSX from 'xlsx'

const COL_MAP: Record<string, string> = {
  'fatura no': 'fatura_no', 'fatura numarası': 'fatura_no', 'faturano': 'fatura_no',
  'marka': 'marka',
  'model': 'model',
  'yıl': 'yil', 'yil': 'yil', 'araç yılı': 'yil',
  'müşteri': 'musteri_adi', 'müşteri adı': 'musteri_adi', 'musteri': 'musteri_adi', 'musteri adi': 'musteri_adi',
  'dosya no': 'dosya_no', 'dosya numarası': 'dosya_no', 'dosyano': 'dosya_no',
  'yedek parça': 'yedek_parca_net', 'yedek parça net': 'yedek_parca_net', 'yedek parca': 'yedek_parca_net', 'yedek parca net': 'yedek_parca_net',
  'işçilik': 'iscilik_net', 'işçilik net': 'iscilik_net', 'iscilik': 'iscilik_net', 'iscilik net': 'iscilik_net',
  'genel toplam': 'genel_toplam', 'toplam': 'genel_toplam',
  'tarih': 'fatura_tarihi', 'fatura tarihi': 'fatura_tarihi',
}

function parseDate(val: any): string {
  if (!val) return ''
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const parts = s.split(/[.\/]/)
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
  }
  return s
}

interface Props {
  onImport: () => void
}

export default function ExcelImport({ onImport }: Props) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMsg('')
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      if (raw.length < 2) { setMsg('Dosya boş veya başlık satırı yok.'); setLoading(false); return }

      const headers: string[] = raw[0].map((h: any) => String(h || '').toLowerCase().trim())
      const fieldMap: Record<number, string> = {}
      headers.forEach((h, i) => { if (COL_MAP[h]) fieldMap[i] = COL_MAP[h] })

      const rows = raw.slice(1).filter(r => r.some(c => c !== null && c !== '')).map(r => {
        const obj: any = {}
        Object.entries(fieldMap).forEach(([idx, field]) => {
          const v = r[Number(idx)]
          if (field === 'fatura_tarihi') obj[field] = parseDate(v)
          else if (['yedek_parca_net', 'iscilik_net', 'genel_toplam', 'yil'].includes(field)) obj[field] = Number(v) || 0
          else obj[field] = v != null ? String(v) : ''
        })
        return obj
      })

      const res = await fetch('/api/faturalar/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows)
      })
      const data = await res.json()
      setMsg(`${data.inserted} fatura başarıyla aktarıldı.`)
      onImport()
    } catch (err) {
      setMsg('Hata: ' + (err as any).message)
    }
    setLoading(false)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{
        padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151',
        display: 'inline-flex', alignItems: 'center', gap: 6
      }}>
        {loading ? 'Aktarılıyor...' : '↑ Excel / CSV İçe Aktar'}
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} disabled={loading} />
      </label>
      {msg && <span style={{ fontSize: 13, color: msg.startsWith('Hata') ? '#dc2626' : '#16a34a' }}>{msg}</span>}
    </div>
  )
}
