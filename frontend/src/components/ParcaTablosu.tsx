import { useState, useEffect, useMemo } from "react"

export interface Parca   { id?:number; parca_adi:string; hasar_durumu:string; parca_no:string; fiyat:number|string; kaynak?:string }
export interface Iscilik { id?:number; parca_adi:string; iscilik_tipi:string; tutar:number|string; kaynak?:string }

interface Props {
  parcalar: Parca[]
  iscilikleri: Iscilik[]
  onChange?: (p:Parca[], i:Iscilik[]) => void
  readonly?: boolean
}

const IST_COLS = ["ONARIM","KAPORTA","BOYA","ELEKTRİK","TRİMQ","CAM","DİĞER"]
const HD       = ["Hasarli","Degismis","Boyali","Kopuk/Kirik","Hasar Yok","Diger"]

// iscilikleri dizisi → matris
function toMatris(list: Iscilik[]): Record<string, Record<string,string>> {
  const m: Record<string, Record<string,string>> = {}
  for (const is of list) {
    if (!is.parca_adi) continue
    if (!m[is.parca_adi]) m[is.parca_adi] = {}
    m[is.parca_adi][is.iscilik_tipi] = String(is.tutar || "")
  }
  return m
}

// matris → iscilikleri dizisi (sadece > 0 olanlar)
function fromMatris(m: Record<string,Record<string,string>>, kaynak="ekspertiz"): Iscilik[] {
  const res: Iscilik[] = []
  for (const [parca_adi, tipler] of Object.entries(m)) {
    for (const [iscilik_tipi, tutar] of Object.entries(tipler)) {
      const t = Number(tutar)
      if (t > 0) res.push({ parca_adi, iscilik_tipi, tutar: t, kaynak })
    }
  }
  return res
}

const inp:React.CSSProperties = { width:"100%", padding:"4px 6px", border:"1px solid #cbd5e1", borderRadius:4, fontSize:12, boxSizing:"border-box" }
const th:React.CSSProperties  = { padding:"8px 6px", background:"#1e293b", color:"#fff", fontWeight:600, fontSize:12, textAlign:"center", whiteSpace:"nowrap" }
const td:React.CSSProperties  = { padding:"6px 8px", borderBottom:"1px solid #e2e8f0", fontSize:13 }

export default function ParcaTablosu({ parcalar, iscilikleri, onChange, readonly=false }:Props) {

  /* ── Parça tablosu state ── */
  const [np, setNp] = useState<Parca>({ parca_adi:"", hasar_durumu:"Hasarli", parca_no:"", fiyat:"" })

  const updP = (i:number, k:keyof Parca, v:string) =>
    onChange?.(parcalar.map((p,x)=>x===i?{...p,[k]:v}:p), iscilikleri)
  const delP = (i:number) => onChange?.(parcalar.filter((_,x)=>x!==i), iscilikleri)
  const addP = () => {
    if (!np.parca_adi.trim()) return
    onChange?.([...parcalar,{...np,fiyat:Number(np.fiyat)||0,kaynak:"ekspertiz"}], iscilikleri)
    setNp({ parca_adi:"", hasar_durumu:"Hasarli", parca_no:"", fiyat:"" })
  }

  /* ── İşçilik matrisi state ── */
  // Satırlar = parcalardaki isimler + isciliklerde olup parcalarda olmayan isimler
  const parçaSatirlari = useMemo(() => {
    const set = new Set<string>(parcalar.map(p=>p.parca_adi).filter(Boolean))
    for (const is of iscilikleri) { if (is.parca_adi) set.add(is.parca_adi) }
    return [...set]
  }, [parcalar, iscilikleri])

  const [ekstraSatir, setEkstraSatir] = useState("")

  // matris: { [parca_adi]: { [iscilik_tipi]: value } }
  const [matris, setMatris] = useState<Record<string,Record<string,string>>>(()=>toMatris(iscilikleri))

  // iscilikleri prop değişince matrisi güncelle (dışarıdan reset)
  useEffect(() => {
    setMatris(toMatris(iscilikleri))
  }, [JSON.stringify(iscilikleri)])

  const setHucre = (parca:string, tip:string, val:string) => {
    const yeni = { ...matris, [parca]: { ...(matris[parca]||{}), [tip]: val } }
    setMatris(yeni)
    onChange?.(parcalar, fromMatris(yeni))
  }

  const satırEkle = () => {
    if (!ekstraSatir.trim()) return
    if (!matris[ekstraSatir]) {
      const yeni = { ...matris, [ekstraSatir]: {} }
      setMatris(yeni)
    }
    setEkstraSatir("")
  }

  // Her satır toplamı
  const satirToplam = (parca:string) =>
    Object.values(matris[parca]||{}).reduce((a,v)=>a+(Number(v)||0),0)

  // Her sütun toplamı
  const sutunToplam = (tip:string) =>
    [...parçaSatirlari, ...Object.keys(matris).filter(k=>!parçaSatirlari.includes(k))]
      .reduce((a,p)=>a+(Number((matris[p]||{})[tip])||0),0)

  const tumSatirlar = [
    ...parçaSatirlari,
    ...Object.keys(matris).filter(k=>!parçaSatirlari.includes(k))
  ]

  const genelToplam = tumSatirlar.reduce((a,p)=>a+satirToplam(p),0)

  /* ── Parça toplamı (fiyat) ── */
  const pTop = parcalar.filter(p=>!p.kaynak||p.kaynak==="ekspertiz").reduce((a,p)=>a+(Number(p.fiyat)||0),0)

  const SecTitle = ({t}:{t:string}) =>
    <div style={{fontWeight:700,fontSize:13,color:"#1e293b",margin:"16px 0 8px",borderLeft:"3px solid #2563eb",paddingLeft:8}}>{t}</div>

  return (
    <div>

      {/* ════ PARÇALAR ════ */}
      <SecTitle t="Parçalar" />
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
          <thead>
            <tr>
              <th style={{...th,textAlign:"left",width:200}}>Parça Adı</th>
              <th style={{...th,width:130}}>Hasar Durumu</th>
              <th style={{...th,width:110}}>Parça No</th>
              <th style={{...th,width:100}}>Fiyat (TL)</th>
              {!readonly && <th style={{...th,width:36}}></th>}
            </tr>
          </thead>
          <tbody>
            {parcalar.map((p,i)=>(
              <tr key={i} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                <td style={td}>{readonly?p.parca_adi:<input style={inp} value={p.parca_adi} onChange={e=>updP(i,"parca_adi",e.target.value)}/>}</td>
                <td style={td}>{readonly?p.hasar_durumu:<select style={inp} value={p.hasar_durumu} onChange={e=>updP(i,"hasar_durumu",e.target.value)}>{HD.map(h=><option key={h}>{h}</option>)}</select>}</td>
                <td style={td}>{readonly?p.parca_no:<input style={inp} value={p.parca_no} onChange={e=>updP(i,"parca_no",e.target.value)}/>}</td>
                <td style={{...td,textAlign:"right"}}>{readonly?(Number(p.fiyat)||0).toLocaleString("tr-TR"):<input style={{...inp,textAlign:"right"}} type="number" value={p.fiyat} onChange={e=>updP(i,"fiyat",e.target.value)}/>}</td>
                {!readonly && <td style={{...td,textAlign:"center"}}><button onClick={()=>delP(i)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16}}>×</button></td>}
              </tr>
            ))}
            {!readonly && (
              <tr style={{background:"#f0fdf4"}}>
                <td style={td}><input style={inp} placeholder="Parça adı (Arka Tampon...)" value={np.parca_adi} onChange={e=>setNp(p=>({...p,parca_adi:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addP()}/></td>
                <td style={td}><select style={inp} value={np.hasar_durumu} onChange={e=>setNp(p=>({...p,hasar_durumu:e.target.value}))}>{HD.map(h=><option key={h}>{h}</option>)}</select></td>
                <td style={td}><input style={inp} value={np.parca_no} onChange={e=>setNp(p=>({...p,parca_no:e.target.value}))}/></td>
                <td style={td}><input style={{...inp,textAlign:"right"}} type="number" placeholder="0" value={np.fiyat} onChange={e=>setNp(p=>({...p,fiyat:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addP()}/></td>
                <td style={{...td,textAlign:"center"}}><button onClick={addP} style={{background:"#2563eb",border:"none",color:"#fff",cursor:"pointer",borderRadius:4,padding:"3px 8px",fontSize:13}}>+</button></td>
              </tr>
            )}
            {parcalar.length>0 && (
              <tr style={{background:"#f1f5f9"}}>
                <td colSpan={3} style={{...td,textAlign:"right",fontWeight:700}}>Parça Toplamı:</td>
                <td style={{...td,textAlign:"right",fontWeight:700,color:"#2563eb"}}>{pTop.toLocaleString("tr-TR")} TL</td>
                {!readonly && <td style={td}/>}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ════ İŞÇİLİK MATRİSİ ════ */}
      <SecTitle t="İşçilik Kalemleri" />
      {!readonly && (
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>
          Parça adları soldaki tablodan otomatik eklenir. Her hücreye işçilik tutarını yazın (boş = 0).
        </p>
      )}

      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:600}}>
          <thead>
            <tr>
              <th style={{...th,textAlign:"left",width:160,background:"#334155",padding:"8px 12px"}}>PARÇA</th>
              {IST_COLS.map(c=>(
                <th key={c} style={{...th,width:80,background:"#334155"}}>{c}</th>
              ))}
              <th style={{...th,width:80,background:"#334155",color:"#fbbf24"}}>TOPLAM</th>
            </tr>
          </thead>
          <tbody>
            {tumSatirlar.map((parca,ri)=>(
              <tr key={parca} style={{background:ri%2===0?"#f8fafc":"#fff"}}>
                <td style={{...td,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",paddingLeft:12,background:ri%2===0?"#f1f5f9":"#e8edf2"}}>
                  {parca}
                </td>
                {IST_COLS.map(tip=>(
                  <td key={tip} style={{...td,textAlign:"center",padding:"4px"}}>
                    {readonly
                      ? (Number((matris[parca]||{})[tip])||0) > 0
                        ? <span style={{fontWeight:600}}>{Number((matris[parca]||{})[tip]).toLocaleString("tr-TR")}</span>
                        : <span style={{color:"#cbd5e1"}}>—</span>
                      : <input
                          type="number"
                          style={{...inp,textAlign:"right",width:72,padding:"3px 5px"}}
                          value={(matris[parca]||{})[tip]||""}
                          placeholder=""
                          onChange={e=>setHucre(parca,tip,e.target.value)}
                        />
                    }
                  </td>
                ))}
                <td style={{...td,textAlign:"right",fontWeight:700,color:satirToplam(parca)>0?"#2563eb":"#94a3b8",paddingRight:10}}>
                  {satirToplam(parca)>0 ? satirToplam(parca).toLocaleString("tr-TR") : "—"}
                </td>
              </tr>
            ))}

            {/* Ekstra satır ekleme */}
            {!readonly && (
              <tr style={{background:"#f0fdf4"}}>
                <td style={{...td,padding:"4px 8px"}} colSpan={1}>
                  <div style={{display:"flex",gap:6}}>
                    <input style={{...inp,flex:1}} placeholder="Ek satır ekle..." value={ekstraSatir}
                      onChange={e=>setEkstraSatir(e.target.value)} onKeyDown={e=>e.key==="Enter"&&satırEkle()}/>
                    <button onClick={satırEkle} style={{background:"#2563eb",border:"none",color:"#fff",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:13,whiteSpace:"nowrap"}}>+ Satır</button>
                  </div>
                </td>
                {IST_COLS.map(c=><td key={c} style={td}/>)}
                <td style={td}/>
              </tr>
            )}

            {/* Sütun toplamları */}
            {tumSatirlar.length > 0 && (
              <tr style={{background:"#1e293b"}}>
                <td style={{...td,fontWeight:700,color:"#fff",background:"#1e293b",paddingLeft:12}}>SÜTUN TOPLAMI</td>
                {IST_COLS.map(tip=>(
                  <td key={tip} style={{...td,textAlign:"right",fontWeight:700,color:sutunToplam(tip)>0?"#fbbf24":"#475569",background:"#1e293b",paddingRight:6}}>
                    {sutunToplam(tip)>0 ? sutunToplam(tip).toLocaleString("tr-TR") : "—"}
                  </td>
                ))}
                <td style={{...td,textAlign:"right",fontWeight:700,color:"#34d399",fontSize:14,background:"#1e293b",paddingRight:10}}>
                  {genelToplam.toLocaleString("tr-TR")} TL
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
