import { useState, useEffect } from 'react'

const MARKALAR = ['OPEL', 'PEUGEOT', 'HYUNDAİ', 'DİĞER']

interface Fatura {
  id?: number
  fatura_no: string
  marka: string
  plaka: string
  yil: string
  musteri_adi: string
  dosya_no: string
  yedek_parca_net: string
  iscilik_net: string
  genel_toplam: string
  fatura_tarihi: string
  odeme_durumu: string
  odeme_tarihi: string
  odenen_tutar: string
}

const EMPTY: Fatura = {
  fatura_no: '', marka: 'OPEL', plaka: '', yil: '', musteri_adi: '', dosya_no: '',
  yedek_parca_net: '', iscilik_net: '', genel_toplam: '',
  fatura_tarihi: new Date().toISOString().slice(0, 10),
  odeme_durumu: 'bekliyor', odeme_tarihi: '', odenen_tutar: ''
}

interface Props {
  initial?: any
  onSave: () => void
  onClose: () => void
}

export default function FaturaForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Fatura>(EMPTY)

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        yil: String(initial.yil || ''),
        plaka: initial.plaka || '',
        yedek_parca_net: String(initial.yedek_parca_net || ''),
        iscilik_net: String(initial.iscilik_net || ''),
        genel_toplam: String(initial.genel_toplam || ''),
        odenen_tutar: String(initial.odenen_tutar || '')
      })
    } else {
      setForm(EMPTY)
    }
  }, [initial])

  const set = (k: keyof Fatura) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = initial?.id ? `/api/faturalar/${initial.id}` : '/api/faturalar'
    const method = initial?.id ? 'PUT' : 'POST'
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        yil: Number(form.yil),
        yedek_parca_net: Number(form.yedek_parca_net),
        iscilik_net: Number(form.iscilik_net),
        genel_toplam: Number(form.genel_toplam),
        odenen_tutar: Number(form.odenen_tutar)
      })
    })
    onSave()
  }

  const inp = (label: string, k: keyof Fatura, type = 'text', opts?: string[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {opts ? (
        <select value={form[k]} onChange={set(k)} style={inputStyle}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={set(k)} style={inputStyle} />
      )}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{initial?.id ? 'Fatura Düzenle' : 'Yeni Fatura'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {inp('Fatura No', 'fatura_no')}
            {inp('Fatura Tarihi', 'fatura_tarihi', 'date')}
            {inp('Marka', 'marka', 'text', MARKALAR)}
            {inp('Plaka', 'plaka')}
            {inp('Yıl', 'yil', 'number')}
            {inp('Müşteri Adı', 'musteri_adi')}
            {inp('Dosya No', 'dosya_no')}
            {inp('Yedek Parça Net (₺)', 'yedek_parca_net', 'number')}
            {inp('İşçilik Net (₺)', 'iscilik_net', 'number')}
            {inp('Genel Toplam (₺)', 'genel_toplam', 'number')}
            {inp('Ödeme Tarihi', 'odeme_tarihi', 'date')}
            {inp('Ödenen Tutar (₺)', 'odenen_tutar', 'number')}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>İptal</button>
            <button type="submit" style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', width: '100%'
}
