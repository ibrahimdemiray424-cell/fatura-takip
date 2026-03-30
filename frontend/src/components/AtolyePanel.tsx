import { useState } from "react"
import { apiFetch } from "../api"
interface Props { dosyaId:number; onUpdate:(d:any)=>void }
const inp:React.CSSProperties={width:"100%",padding:"7px 10px",border:"1px solid #cbd5e1",borderRadius:6,fontSize:13,boxSizing:"border-box"}
const HD  = ["Hasarli","Degismis","Boyali","Kopuk/Kirik","Hasar Yok","Diger"]
const IST = ["Kaporta","Boya","Elektrik","Trim/Doseme","Cam","Mekanik","Boyasiz Gocuk","Yikama","Diger"]
export default function AtolyePanel({dosyaId,onUpdate}:Props){
  const [tip,setTip]=useState<"parca"|"iscilik">("parca")
  const [p,setP]=useState({parca_adi:"",hasar_durumu:"Hasarli",parca_no:"",fiyat:""})
  const [is,setIs]=useState({parca_adi:"",iscilik_tipi:"Kaporta",tutar:""})
  const [load,setLoad]=useState(false)
  const ekle=async()=>{
    const body:any={tip}
    if(tip==="parca"){if(!p.parca_adi.trim()){alert("Parca adi zorunlu");return}; Object.assign(body,{...p,fiyat:Number(p.fiyat)||0})}
    else{if(!is.parca_adi.trim()){alert("Parca adi zorunlu");return}; Object.assign(body,{...is,tutar:Number(is.tutar)||0})}
    setLoad(true)
    const res=await apiFetch(`/api/ekspertiz/${dosyaId}/atolye`,{method:"POST",body:JSON.stringify(body)})
    const data=await res.json(); setLoad(false)
    if(!res.ok){alert(data.error||"Hata");return}
    onUpdate(data); setP({parca_adi:"",hasar_durumu:"Hasarli",parca_no:"",fiyat:""}); setIs({parca_adi:"",iscilik_tipi:"Kaporta",tutar:""})
  }
  return(<div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:10,padding:16}}>
    <div style={{fontWeight:700,fontSize:14,color:"#c2410c",marginBottom:12}}>Atolye Ek Kalem Ekle</div>
    <div style={{display:"flex",gap:0,marginBottom:12,border:"1px solid #fed7aa",borderRadius:6,overflow:"hidden",width:"fit-content"}}>
      {(["parca","iscilik"] as const).map(t=><button key={t} onClick={()=>setTip(t)} style={{padding:"6px 16px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:tip===t?"#ea580c":"#fff7ed",color:tip===t?"#fff":"#c2410c"}}>{t==="parca"?"Parca":"Iscilik"}</button>)}
    </div>
    {tip==="parca"
      ?<div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr",gap:8}}>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Parca Adi *</label><input style={inp} value={p.parca_adi} onChange={e=>setP(x=>({...x,parca_adi:e.target.value}))}/></div>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Hasar</label><select style={inp} value={p.hasar_durumu} onChange={e=>setP(x=>({...x,hasar_durumu:e.target.value}))}>{HD.map(h=><option key={h}>{h}</option>)}</select></div>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Parca No</label><input style={inp} value={p.parca_no} onChange={e=>setP(x=>({...x,parca_no:e.target.value}))}/></div>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Fiyat</label><input style={{...inp,textAlign:"right"}} type="number" value={p.fiyat} onChange={e=>setP(x=>({...x,fiyat:e.target.value}))}/></div>
        </div>
      :<div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr",gap:8}}>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Parca Adi *</label><input style={inp} value={is.parca_adi} onChange={e=>setIs(x=>({...x,parca_adi:e.target.value}))} placeholder="Arka Tampon, On Cam..."/></div>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Iscilik Tipi</label><select style={inp} value={is.iscilik_tipi} onChange={e=>setIs(x=>({...x,iscilik_tipi:e.target.value}))}>{IST.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Tutar</label><input style={{...inp,textAlign:"right"}} type="number" value={is.tutar} onChange={e=>setIs(x=>({...x,tutar:e.target.value}))}/></div>
        </div>}
    <button disabled={load} onClick={ekle} style={{marginTop:12,padding:"8px 20px",background:"#ea580c",color:"#fff",border:"none",borderRadius:6,fontWeight:600,cursor:"pointer",fontSize:13}}>Ekle</button>
  </div>)
}
