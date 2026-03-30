import { useState } from "react"
import { apiFetch } from "../api"
interface Props { dosyaId:number; onUpdate:(d:any)=>void }
const inp:React.CSSProperties={width:"100%",padding:"8px 10px",border:"1px solid #cbd5e1",borderRadius:6,fontSize:13,boxSizing:"border-box"}
export default function EksperOnayPanel({dosyaId,onUpdate}:Props){
  const [adi,setAdi]=useState("")
  const [not,setNot]=useState("")
  const [load,setLoad]=useState(false)
  const gonder=async(durum:"eksper_onaylandi"|"taslak")=>{
    if(durum==="eksper_onaylandi"&&!adi.trim()){alert("Eksper adi zorunludur.");return}
    setLoad(true)
    const res=await apiFetch(`/api/ekspertiz/${dosyaId}/durum`,{method:"PATCH",body:JSON.stringify({durum,eksper_adi:adi,eksper_notu:not})})
    const data=await res.json()
    setLoad(false)
    if(!res.ok){alert(data.error||"Hata");return}
    onUpdate(data)
  }
  return(<div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:10,padding:16}}>
    <div style={{fontWeight:700,fontSize:14,color:"#854d0e",marginBottom:12}}>Eksper Onayi</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
      <div><label style={{fontSize:12,color:"#64748b",display:"block",marginBottom:4}}>Eksper Adi *</label><input style={inp} value={adi} onChange={e=>setAdi(e.target.value)} placeholder="Ad Soyad..."/></div>
      <div><label style={{fontSize:12,color:"#64748b",display:"block",marginBottom:4}}>Not</label><input style={inp} value={not} onChange={e=>setNot(e.target.value)} placeholder="Opsiyonel not..."/></div>
    </div>
    <div style={{display:"flex",gap:8,marginTop:12}}>
      <button disabled={load} onClick={()=>gonder("eksper_onaylandi")} style={{padding:"8px 18px",background:"#16a34a",color:"#fff",border:"none",borderRadius:6,fontWeight:600,cursor:"pointer",fontSize:13}}>Onayla</button>
      <button disabled={load} onClick={()=>gonder("taslak")} style={{padding:"8px 18px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,fontWeight:600,cursor:"pointer",fontSize:13}}>Reddet</button>
    </div>
  </div>)
}
