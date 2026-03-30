import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiFetch } from "../api"
import DurumRozeti from "../components/DurumRozeti"
import EksperOnayPanel from "../components/EksperOnayPanel"
import AtolyePanel from "../components/AtolyePanel"

const SONRAKI:Record<string,{label:string;durum:string;renk:string}[]> = {
  eksper_onaylandi  :[{label:"Kaporta Sürecine Al",durum:"kaporta_surecinde",renk:"#c2410c"},{label:"Boya Sürecine Al",durum:"boya_surecinde",renk:"#9d174d"},{label:"Tamamlandı",durum:"tamamlandi",renk:"#166534"}],
  kaporta_surecinde :[{label:"Boya Sürecine Geç",durum:"boya_surecinde",renk:"#9d174d"},{label:"Tamamlandı",durum:"tamamlandi",renk:"#166534"}],
  boya_surecinde    :[{label:"Kaporta Sürecine Geç",durum:"kaporta_surecinde",renk:"#c2410c"},{label:"Tamamlandı",durum:"tamamlandi",renk:"#166534"}],
}
const ATOLYE    = ["eksper_onaylandi","kaporta_surecinde","boya_surecinde"]
const IST_COLS  = ["ONARIM","KAPORTA","BOYA","ELEKTRİK","TRİMQ","CAM","DİĞER"]

const td:React.CSSProperties = { padding:"7px 8px", borderBottom:"1px solid #e2e8f0", fontSize:13 }
const th:React.CSSProperties = { padding:"8px 6px", background:"#334155", color:"#fff", fontWeight:600, fontSize:12, textAlign:"center" as const, whiteSpace:"nowrap" as const }

function InfoKart({ baslik, rows }:{ baslik:string; rows:{l:string;v:string}[] }) {
  return (
    <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"10px 16px",background:"#1e293b",color:"#fff",fontSize:13,fontWeight:700}}>{baslik}</div>
      <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"8px 20px"}}>
        {rows.map(r=><div key={r.l}><span style={{fontSize:11,color:"#64748b",display:"block"}}>{r.l}</span><span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{r.v||"--"}</span></div>)}
      </div>
    </div>
  )
}

function Bolum({ title, children, renk="#1e293b" }:{ title:string; children:React.ReactNode; renk?:string }) {
  return (
    <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",marginBottom:14,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",background:renk,color:"#fff",fontSize:13,fontWeight:700}}>{title}</div>
      <div style={{padding:16}}>{children}</div>
    </div>
  )
}

/* Parça tablosu (readonly) */
function ParcaTablo({ list }:{ list:any[] }) {
  if (!list.length) return <p style={{color:"#94a3b8",fontSize:13,margin:0}}>Kayıt yok</p>
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{...th,textAlign:"left" as const,paddingLeft:10}}>Parça Adı</th>
          <th style={{...th,width:130}}>Hasar</th>
          <th style={{...th,width:110}}>Parça No</th>
          <th style={{...th,width:110,textAlign:"right" as const,paddingRight:10}}>Fiyat (TL)</th>
        </tr></thead>
        <tbody>{list.map((p:any,i:number)=>(
          <tr key={p.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
            <td style={{...td,paddingLeft:10}}>{p.parca_adi}</td>
            <td style={{...td,textAlign:"center"}}>{p.hasar_durumu}</td>
            <td style={{...td,textAlign:"center"}}>{p.parca_no}</td>
            <td style={{...td,textAlign:"right",paddingRight:10}}>{(p.fiyat||0).toLocaleString("tr-TR")}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

/* İşçilik matrisi (readonly) */
function IscilikMatris({ list }:{ list:any[] }) {
  if (!list.length) return <p style={{color:"#94a3b8",fontSize:13,margin:0}}>Kayıt yok</p>

  // satırlar
  const satirlar = [...new Set(list.map((i:any)=>i.parca_adi).filter(Boolean))]

  // hücre değeri
  const hucre = (parca:string, tip:string) => {
    const is = list.find((i:any)=>i.parca_adi===parca && i.iscilik_tipi===tip)
    return is ? Number(is.tutar)||0 : 0
  }
  const satirTop = (parca:string) => IST_COLS.reduce((a,t)=>a+hucre(parca,t),0)
  const sutunTop = (tip:string) => satirlar.reduce((a,p)=>a+hucre(p,tip),0)
  const genelTop = satirlar.reduce((a,p)=>a+satirTop(p),0)

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr>
            <th style={{...th,textAlign:"left" as const,paddingLeft:10,background:"#334155",width:160}}>PARÇA</th>
            {IST_COLS.map(c=><th key={c} style={{...th,width:78,background:"#334155"}}>{c}</th>)}
            <th style={{...th,width:90,background:"#334155",color:"#fbbf24"}}>TOPLAM</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((parca,ri)=>(
            <tr key={parca} style={{background:ri%2===0?"#f8fafc":"#fff"}}>
              <td style={{...td,fontWeight:600,paddingLeft:10,background:ri%2===0?"#f1f5f9":"#e8edf2",whiteSpace:"nowrap"}}>{parca}</td>
              {IST_COLS.map(tip=>{
                const v=hucre(parca,tip)
                return <td key={tip} style={{...td,textAlign:"center"}}>
                  {v>0 ? <span style={{fontWeight:600,color:"#1e293b"}}>{v.toLocaleString("tr-TR")}</span>
                       : <span style={{color:"#cbd5e1"}}>—</span>}
                </td>
              })}
              <td style={{...td,textAlign:"right",fontWeight:700,color:satirTop(parca)>0?"#2563eb":"#94a3b8",paddingRight:10}}>
                {satirTop(parca)>0?satirTop(parca).toLocaleString("tr-TR"):"—"}
              </td>
            </tr>
          ))}
          {/* Sütun toplamları */}
          <tr style={{background:"#1e293b"}}>
            <td style={{...td,fontWeight:700,color:"#fff",paddingLeft:10,background:"#1e293b"}}>SÜTUN TOPLAMI</td>
            {IST_COLS.map(tip=>{
              const v=sutunTop(tip)
              return <td key={tip} style={{...td,textAlign:"center",fontWeight:700,color:v>0?"#fbbf24":"#475569",background:"#1e293b"}}>
                {v>0?v.toLocaleString("tr-TR"):"—"}
              </td>
            })}
            <td style={{...td,textAlign:"right",fontWeight:700,color:"#34d399",fontSize:14,paddingRight:10,background:"#1e293b"}}>
              {genelTop.toLocaleString("tr-TR")} TL
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function EkspertizDetay() {
  const nav = useNavigate(); const { id } = useParams<{id:string}>()
  const [dosya,setDosya] = useState<any>(null)
  const [load,setLoad]   = useState(true)
  const [dLoad,setDLoad] = useState(false)

  useEffect(()=>{ if(!id)return; apiFetch(`/api/ekspertiz/${id}`).then(r=>r.json()).then(d=>{setDosya(d);setLoad(false)}) },[id])

  if (load)   return <div style={{padding:40,textAlign:"center",color:"#64748b"}}>Yükleniyor...</div>
  if (!dosya) return <div style={{padding:40,textAlign:"center",color:"#dc2626"}}>Bulunamadı</div>

  const pE=(dosya.parcalar||[]).filter((p:any)=>p.kaynak!=="atolye")
  const pA=(dosya.parcalar||[]).filter((p:any)=>p.kaynak==="atolye")
  const iE=(dosya.iscilikleri||[]).filter((i:any)=>i.kaynak!=="atolye")
  const iA=(dosya.iscilikleri||[]).filter((i:any)=>i.kaynak==="atolye")
  const ptE=pE.reduce((a:number,p:any)=>a+(p.fiyat||0),0)
  const ptA=pA.reduce((a:number,p:any)=>a+(p.fiyat||0),0)
  const itE=iE.reduce((a:number,i:any)=>a+(i.tutar||0),0)
  const itA=iA.reduce((a:number,i:any)=>a+(i.tutar||0),0)
  const genel=ptE+ptA+itE+itA

  const gecis=async(d:string)=>{ setDLoad(true); const r=await apiFetch(`/api/ekspertiz/${id}/durum`,{method:"PATCH",body:JSON.stringify({durum:d})}); setDosya(await r.json()); setDLoad(false) }

  return (
    <div style={{padding:24}}>

      {/* Üst bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>nav("/")} style={{background:"none",border:"1px solid #cbd5e1",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>← Geri</button>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#1e293b"}}>{dosya.rapor_no}</h1>
              <DurumRozeti durum={dosya.durum}/>
            </div>
            <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>{dosya.plaka} — {dosya.marka_model}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {dosya.durum!=="tamamlandi"&&<button onClick={()=>nav(`/${id}/duzenle`)} style={{padding:"8px 16px",background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Düzenle</button>}
          <a href={`/api/ekspertiz/${id}/excel`} target="_blank" style={{padding:"8px 16px",background:"#166534",color:"#fff",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-block"}}>Excel</a>
          <a href={`/api/ekspertiz/${id}/pdf`}   target="_blank" style={{padding:"8px 16px",background:"#7c3aed",color:"#fff",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-block"}}>PDF</a>
          {(SONRAKI[dosya.durum]||[]).map((g:any)=>(
            <button key={g.durum} disabled={dLoad} onClick={()=>gecis(g.durum)}
              style={{padding:"8px 16px",background:g.renk,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <InfoKart baslik="Araç Bilgileri" rows={[{l:"Plaka",v:dosya.plaka},{l:"Marka/Model",v:dosya.marka_model},{l:"Yıl",v:dosya.yil},{l:"Renk",v:dosya.renk},{l:"Şase No",v:dosya.sasi_no},{l:"Motor No",v:dosya.motor_no},{l:"Kilometre",v:dosya.km},{l:"Yakıt",v:dosya.yakit_turu}]}/>
      <InfoKart baslik="Müşteri & Sigorta" rows={[{l:"Müşteri",v:dosya.musteri_adi},{l:"Telefon",v:dosya.musteri_tel},{l:"Sigorta Şirketi",v:dosya.sigorta_sirketi},{l:"Poliçe No",v:dosya.police_no},{l:"Hasar Tarihi",v:dosya.hasar_tarihi},{l:"İhbar Tarihi",v:dosya.ihbar_tarihi}]}/>

      {dosya.eksper_adi&&(
        <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:14,marginBottom:14,fontSize:13}}>
          <strong style={{color:"#166534"}}>Eksper Onayı:</strong> {dosya.eksper_adi}
          {dosya.eksper_notu&&<span style={{color:"#64748b",marginLeft:8}}>— {dosya.eksper_notu}</span>}
          <span style={{color:"#94a3b8",marginLeft:8,fontSize:11}}>{dosya.eksper_tarih?.split("T")[0]}</span>
        </div>
      )}

      <Bolum title="Ekspertiz Parçaları">
        <ParcaTablo list={pE}/>
        {pE.length>0&&<div style={{textAlign:"right",fontWeight:700,marginTop:8,fontSize:14,color:"#2563eb"}}>Toplam: {ptE.toLocaleString("tr-TR")} TL</div>}
      </Bolum>

      <Bolum title="Ekspertiz İşçilikleri">
        <IscilikMatris list={iE}/>
        {iE.length>0&&<div style={{textAlign:"right",fontWeight:700,marginTop:8,fontSize:14,color:"#2563eb"}}>Toplam: {itE.toLocaleString("tr-TR")} TL</div>}
      </Bolum>

      {(pA.length>0||iA.length>0)&&<>
        <Bolum title="Atölye Ek Parçaları" renk="#c2410c">
          <ParcaTablo list={pA}/>
          {pA.length>0&&<div style={{textAlign:"right",fontWeight:700,marginTop:8,fontSize:14,color:"#c2410c"}}>Toplam: {ptA.toLocaleString("tr-TR")} TL</div>}
        </Bolum>
        <Bolum title="Atölye Ek İşçilikleri" renk="#c2410c">
          <IscilikMatris list={iA}/>
          {iA.length>0&&<div style={{textAlign:"right",fontWeight:700,marginTop:8,fontSize:14,color:"#c2410c"}}>Toplam: {itA.toLocaleString("tr-TR")} TL</div>}
        </Bolum>
      </>}

      {/* Genel Toplam */}
      <div style={{background:"#1e293b",borderRadius:10,padding:"14px 20px",marginBottom:14,display:"flex",justifyContent:"flex-end",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <span style={{color:"#94a3b8",fontSize:13}}>Eks. Parça: <strong style={{color:"#fff"}}>{ptE.toLocaleString("tr-TR")} TL</strong></span>
        <span style={{color:"#94a3b8",fontSize:13}}>Ato. Parça: <strong style={{color:"#fff"}}>{ptA.toLocaleString("tr-TR")} TL</strong></span>
        <span style={{color:"#94a3b8",fontSize:13}}>Eks. İşçilik: <strong style={{color:"#fff"}}>{itE.toLocaleString("tr-TR")} TL</strong></span>
        <span style={{color:"#94a3b8",fontSize:13}}>Ato. İşçilik: <strong style={{color:"#fff"}}>{itA.toLocaleString("tr-TR")} TL</strong></span>
        <span style={{fontSize:16,fontWeight:700,color:"#34d399"}}>GENEL TOPLAM: {genel.toLocaleString("tr-TR")} TL</span>
      </div>

      {dosya.durum==="eksper_bekliyor"&&<div style={{marginBottom:14}}><EksperOnayPanel dosyaId={dosya.id} onUpdate={setDosya}/></div>}
      {ATOLYE.includes(dosya.durum)&&<div style={{marginBottom:14}}><AtolyePanel dosyaId={dosya.id} onUpdate={setDosya}/></div>}
    </div>
  )
}

