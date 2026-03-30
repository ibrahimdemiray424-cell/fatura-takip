import { useState } from 'react'
import * as XLSX from 'xlsx'
import { apiFetch } from '../api'

const COL_MAP: Record<string, string> = {
  'fatura no': 'fatura_no', 'fatura numarası': 'fatura_no', 'faturano': 'fatura_no', 'fatura_no': 'fatura_no',
  'marka': 'marka',
  'model': 'model',
  'yıl': 'yil', 'yil': 'yil', 'araç yılı': 'yil', 'model yılı': 'yil',
  'müşteri': 'musteri_adi', 'müşteri adı': 'musteri_adi', 'musteri': 'musteri_adi', 'musteri adi': 'musteri_adi', 'musteri_adi': 'musteri_adi',
  'finansal müşteri': 'musteri_adi',
  'dosya no': 'dosya_no', 'dosya numarası': 'dosya_no', 'dosyano': 'dosya_no', 'dosya_no': 'dosya_no',
  'sigorta dosya no': 'dosya_no',
  'plaka': 'plaka',
  'yedek parça': 'yedek_parca_net', 'yedek parça net': 'yedek_parca_net', 'yedek parca': 'yedek_parca_net', 'yedek parca net': 'yedek_parca_net', 'yedek_parca_net': 'yedek_parca_net',
  'y.parça tutarı': '__yp_brut', 'y.parca tutarı': '__yp_brut',
  'işçilik': 'iscilik_net', 'işçilik net': 'iscilik_net', 'iscilik': 'iscilik_net', 'iscilik net': 'iscilik_net', 'iscilik_net': 'iscilik_net',
  'i̇şçilik tutarı': '__isc_brut', 'işçilik tutarı': '__isc_brut',
  'işçilik i̇sk.tut': '__isc_isk', 'işçilik isk.tut': '__isc_isk', 'i̇şçilik i̇sk.tut': '__isc_isk',
  'y.parça i̇sk.tut': '__yp_isk', 'y.parça isk.tut': '__yp_isk', 'y.parca isk.tut': '__yp_isk',
  'genel toplam': 'genel_toplam', 'toplam': 'genel_toplam', 'genel_toplam': 'genel_toplam',
  'tarih': 'fatura_tarihi', 'fatura tarihi': 'fatura_tarihi', 'fatura_tarihi': 'fatura_tarihi', 'fat.tarihi': 'fatura_tarihi',
  'ödenen tutar': 'odenen_tutar', 'odenen tutar': 'odenen_tutar', 'odenen_tutar': 'odenen_tutar',
  'kasko': 'sigorta_sirketi',
  'sigorta': 'sigorta_sirketi',
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
  const [loading, setLoading] = useState<'direkt' | 'havuz' | null>(null)
  const [msg, setMsg] = useState('')

  const parseRows = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
    if (raw.length < 2) throw new Error('Dosya boş veya başlık satırı yok.')
    const headers: string[] = raw[0].map((h: any) => String(h || '').toLowerCase().trim())
    const fieldMap: Record<number, string> = {}
    headers.forEach((h, i) => { if (COL_MAP[h]) fieldMap[i] = COL_MAP[h] })

    return raw.slice(1).filter(r => r.some(c => c !== null && c !== '')).map(r => {
      const raw_obj: any = {}
      Object.entries(fieldMap).forEach(([idx, field]) => {
        const v = r[Number(idx)]
        if (field === 'fatura_tarihi') raw_obj[field] = parseDate(v)
        else if (['yedek_parca_net', 'iscilik_net', 'genel_toplam', 'yil',
                  '__yp_brut', '__yp_isk', '__isc_brut', '__isc_isk'].includes(field))
          raw_obj[field] = Number(v) || 0
        else raw_obj[field] = v != null ? String(v) : ''
      })
      // Efes Pro: net tutarları hesapla (brüt - iskonto)
      if ('__isc_brut' in raw_obj) raw_obj.iscilik_net = (raw_obj.__isc_brut || 0) - (raw_obj.__isc_isk || 0)
      if ('__yp_brut' in raw_obj) raw_obj.yedek_parca_net = (raw_obj.__yp_brut || 0) - (raw_obj.__yp_isk || 0)
      // genel_toplam yoksa yedek parça + işçilik
      if (!raw_obj.genel_toplam && (raw_obj.yedek_parca_net || raw_obj.iscilik_net))
        raw_obj.genel_toplam = (raw_obj.yedek_parca_net || 0) + (raw_obj.iscilik_net || 0)
      // ara alanları temizle
      delete raw_obj.__yp_brut; delete raw_obj.__yp_isk
      delete raw_obj.__isc_brut; delete raw_obj.__isc_isk
      return raw_obj
    })
  }

  const handleFile = (mod: 'direkt' | 'havuz') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(mod); setMsg('')
    try {
      const rows = await parseRows(file)
      const endpoint = mod === 'havuz' ? '/api/faturalar/havuz/yukle' : '/api/faturalar/bulk'
      const res = await apiFetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows)
      })
      const data = await res.json()
      if (mod === 'havuz') setMsg(`${data.inserted} kayıt havuza yüklendi. Şimdi fatura numaralarını girebilirsiniz.`)
      else { setMsg(`${data.inserted} fatura sisteme eklendi.`); onImport() }
    } catch (err) {
      setMsg('Hata: ' + (err as any).message)
    }
    setLoading(null)
    e.target.value = ''
  }

  const btnStyle = (color: string) => ({
    padding: '9px 16px', background: color, border: 'none',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
    display: 'inline-flex', alignItems: 'center', gap: 6
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <label style={btnStyle('#2563eb')}>
          {loading === 'havuz' ? 'Yükleniyor...' : '☁ Havuza Yükle'}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile('havuz')} style={{ display: 'none' }} disabled={!!loading} />
        </label>
        <label style={btnStyle('#6b7280')}>
          {loading === 'direkt' ? 'Aktarılıyor...' : '↑ Direkt Ekle'}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile('direkt')} style={{ display: 'none' }} disabled={!!loading} />
        </label>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Havuza Yükle → fatura no girerek seç | Direkt Ekle → hepsini ekle</span>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: msg.startsWith('Hata') ? '#dc2626' : '#16a34a' }}>{msg}</div>}
    </div>
  )
}
