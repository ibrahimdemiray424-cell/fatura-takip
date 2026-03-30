import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api"
import DurumRozeti from "../components/DurumRozeti"
const DURUMLAR=[{v:"",l:"Tümü"},{v:"taslak",l:"Taslak"},{v:"eksper_bekliyor",l:"Eksper Bekliyor"},{v:"eksper_onaylandi",l:"Eksper Onaylandı"},{v:"kaporta_surecinde",l:"Kaporta Sürecinde"},{v:"boya_surecinde",l:"Boya Sürecinde"},{v:"tamamlandi",l:"Tamamlandı"}]
const th:React.CSSProperties={padding:"10px 12px",textAlign:"left",background:"#1e293b",color:"#fff",fontSize:12,fontWeight:600}
const td:React.CSSProperties={padding:"10px 12px",fontSize:13,borderBottom:"1px solid #e2e8f0"}
export default function Ekspertiz(){
  const nav=useNavigate()
  const [liste,setListe]=useState<any[]>([])
  const [ara,setAra]=useState("")
  const [durum,setDurum]=useState("")
  const [load,setLoad]=useState(true)
  const yukle=async()=>{ setLoad(true); const q=new URLSearchParams(); if(ara)q.set("ara",ara); if(durum)q.set("durum",durum); const r=await apiFetch(`/api/ekspertiz?${q}`); setListe(await r.json()); setLoad(false) }
  useEffect(()=>{yukle()},[durum])
  const sil=async(id:number)=>{ if(!confirm("Bu dosyayı silmek istediğinize emin misiniz?"))return; await apiFetch(`/api/ekspertiz/${id}`,{method:"DELETE"}); yukle() }
  return(<div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:"#1e293b"}}>Ön Ekspertiz Dosyaları</h1>
        <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>{liste.length} dosya</p>
      </div>
      <button onClick={()=>nav("/ekspertiz/yeni")} style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14}}>+ Yeni Ekspertiz</button>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:16}}>
      <input style={{flex:1,padding:"8px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13}} placeholder="Plaka, rapor no veya müşteri ara..." value={ara} onChange={e=>setAra(e.target.value)} onKeyDown={e=>e.key==="Enter"&&yukle()}/>
      <select style={{padding:"8px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13}} value={durum} onChange={e=>setDurum(e.target.value)}>
        {DURUMLAR.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
      </select>
      <button onClick={yukle} style={{padding:"8px 16px",background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,cursor:"pointer"}}>Ara</button>
    </div>
    <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",overflow:"hidden"}}>
      {load?<div style={{padding:40,textAlign:"center",color:"#64748b"}}>Yükleniyor...</div>
       :liste.length===0?<div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Kayıt bulunamadı</div>
       :<table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={th}>Rapor No</th><th style={th}>Plaka</th><th style={th}>Araç</th><th style={th}>Müşteri</th><th style={th}>Durum</th><th style={th}>Tarih</th><th style={th}></th></tr></thead>
          <tbody>{liste.map((d,i)=>(
            <tr key={d.id} style={{background:i%2===0?"#f8fafc":"#fff",cursor:"pointer"}} onClick={()=>nav(`/ekspertiz/${d.id}`)}>
              <td style={{...td,fontWeight:600,color:"#2563eb"}}>{d.rapor_no}</td>
              <td style={{...td,fontWeight:600}}>{d.plaka}</td>
              <td style={td}>{d.marka_model} {d.yil?`(${d.yil})`:""}</td>
              <td style={td}>{d.musteri_adi}</td>
              <td style={td}><DurumRozeti durum={d.durum}/></td>
              <td style={{...td,color:"#64748b",fontSize:12}}>{d.created_at?.split("T")[0]}</td>
              <td style={{...td,textAlign:"right"}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>nav(`/ekspertiz/${d.id}`)} style={{background:"none",border:"1px solid #cbd5e1",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,marginRight:6}}>Detay</button>
                <button onClick={()=>nav(`/ekspertiz/${d.id}/duzenle`)} style={{background:"none",border:"1px solid #cbd5e1",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,marginRight:6}}>Düzenle</button>
                <button onClick={()=>sil(d.id)} style={{background:"none",border:"1px solid #fca5a5",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#dc2626"}}>Sil</button>
              </td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  </div>)
}
