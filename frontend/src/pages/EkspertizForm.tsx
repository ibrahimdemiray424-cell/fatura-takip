import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiFetch } from "../api"
import ParcaTablosu, { type Parca, type Iscilik } from "../components/ParcaTablosu"
const inp:React.CSSProperties={width:"100%",padding:"8px 10px",border:"1px solid #cbd5e1",borderRadius:6,fontSize:13,boxSizing:"border-box"}
const lbl:React.CSSProperties={fontSize:12,color:"#64748b",display:"block",marginBottom:4,fontWeight:500}
function FA({label,children}:{label:string;children:React.ReactNode}){return<div><label style={lbl}>{label}</label>{children}</div>}
function Bolum({title,children}:{title:string;children:React.ReactNode}){return<div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",marginBottom:16,overflow:"hidden"}}><div style={{padding:"12px 20px",background:"#1e293b",color:"#fff",fontSize:14,fontWeight:700}}>{title}</div><div style={{padding:20,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>{children}</div></div>}
const YAKIT=["Benzin","Dizel","LPG","Elektrik","Hibrit"]
const BOSLUK={plaka:"",marka_model:"",yil:"",renk:"",sasi_no:"",motor_no:"",km:"",yakit_turu:"Benzin",musteri_adi:"",musteri_tel:"",sigorta_sirketi:"",police_no:"",hasar_tarihi:"",ihbar_tarihi:""}
export default function EkspertizForm(){
  const nav=useNavigate(); const {id}=useParams(); const duz=!!id
  const [form,setForm]=useState(BOSLUK)
  const [parcalar,setParcalar]=useState<Parca[]>([])
  const [iscilikleri,setIscilikleri]=useState<Iscilik[]>([])
  const [load,setLoad]=useState(false)
  useEffect(()=>{
    if(!duz)return
    apiFetch(`/api/ekspertiz/${id}`).then(r=>r.json()).then(d=>{
      setForm({plaka:d.plaka||"",marka_model:d.marka_model||"",yil:d.yil||"",renk:d.renk||"",sasi_no:d.sasi_no||"",motor_no:d.motor_no||"",km:d.km||"",yakit_turu:d.yakit_turu||"Benzin",musteri_adi:d.musteri_adi||"",musteri_tel:d.musteri_tel||"",sigorta_sirketi:d.sigorta_sirketi||"",police_no:d.police_no||"",hasar_tarihi:d.hasar_tarihi||"",ihbar_tarihi:d.ihbar_tarihi||""})
      setParcalar((d.parcalar||[]).filter((p:any)=>p.kaynak==="ekspertiz"))
      setIscilikleri((d.iscilikleri||[]).filter((i:any)=>i.kaynak==="ekspertiz"))
    })
  },[id])
  const f=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value}))
  const kaydet=async(sonraki?:string)=>{
    if(!form.plaka.trim()){alert("Plaka zorunludur.");return}
    setLoad(true)
    const body={...form,parcalar,iscilikleri}
    const res=duz?await apiFetch(`/api/ekspertiz/${id}`,{method:"PUT",body:JSON.stringify(body)}):await apiFetch("/api/ekspertiz",{method:"POST",body:JSON.stringify(body)})
    const data=await res.json()
    if(!res.ok){alert(data.error||"Hata");setLoad(false);return}
    if(sonraki) await apiFetch(`/api/ekspertiz/${data.id}/durum`,{method:"PATCH",body:JSON.stringify({durum:sonraki})})
    setLoad(false); nav(`/${data.id}`)
  }
  const pT=parcalar.reduce((a,p)=>a+(Number(p.fiyat)||0),0)
  const iT=iscilikleri.reduce((a,i)=>a+(Number(i.tutar)||0),0)
  return(<div style={{padding:24,paddingBottom:90}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
      <button onClick={()=>nav(-1)} style={{background:"none",border:"1px solid #cbd5e1",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>Geri</button>
      <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#1e293b"}}>{duz?"Ekspertiz Duzenle":"Yeni Ekspertiz"}</h1>
    </div>
    <Bolum title="Arac Bilgileri">
      <FA label="Plaka *"><input style={inp} value={form.plaka} onChange={f("plaka")} placeholder="34 ABC 123"/></FA>
      <FA label="Marka / Model"><input style={inp} value={form.marka_model} onChange={f("marka_model")} placeholder="Opel Astra"/></FA>
      <FA label="Yil"><input style={inp} type="number" value={form.yil} onChange={f("yil")} placeholder="2020"/></FA>
      <FA label="Renk"><input style={inp} value={form.renk} onChange={f("renk")} placeholder="Beyaz"/></FA>
      <FA label="Sase No"><input style={inp} value={form.sasi_no} onChange={f("sasi_no")}/></FA>
      <FA label="Motor No"><input style={inp} value={form.motor_no} onChange={f("motor_no")}/></FA>
      <FA label="Kilometre"><input style={inp} value={form.km} onChange={f("km")} placeholder="85000"/></FA>
      <FA label="Yakit Turu"><select style={inp} value={form.yakit_turu} onChange={f("yakit_turu")}>{YAKIT.map(y=><option key={y}>{y}</option>)}</select></FA>
    </Bolum>
    <Bolum title="Musteri Bilgileri">
      <FA label="Musteri Adi"><input style={inp} value={form.musteri_adi} onChange={f("musteri_adi")}/></FA>
      <FA label="Telefon"><input style={inp} value={form.musteri_tel} onChange={f("musteri_tel")}/></FA>
    </Bolum>
    <Bolum title="Sigorta / Police Bilgileri">
      <FA label="Sigorta Sirketi"><input style={inp} value={form.sigorta_sirketi} onChange={f("sigorta_sirketi")}/></FA>
      <FA label="Police No"><input style={inp} value={form.police_no} onChange={f("police_no")}/></FA>
      <FA label="Hasar Tarihi"><input style={inp} type="date" value={form.hasar_tarihi} onChange={f("hasar_tarihi")}/></FA>
      <FA label="Ihbar Tarihi"><input style={inp} type="date" value={form.ihbar_tarihi} onChange={f("ihbar_tarihi")}/></FA>
    </Bolum>
    <div style={{background:"#fff",borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",marginBottom:16,overflow:"hidden"}}>
      <div style={{padding:"12px 20px",background:"#1e293b",color:"#fff",fontSize:14,fontWeight:700}}>Parca ve Iscilik Tespitleri</div>
      <div style={{padding:20}}><ParcaTablosu parcalar={parcalar} iscilikleri={iscilikleri} onChange={(p,i)=>{setParcalar(p);setIscilikleri(i)}}/></div>
    </div>
    <div style={{position:"fixed",bottom:0,left:220,right:0,background:"#fff",borderTop:"1px solid #e2e8f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:100}}>
      <div style={{fontSize:14}}>
        <span style={{color:"#64748b"}}>Parca: </span><strong>{pT.toLocaleString("tr-TR")} TL</strong>
        <span style={{color:"#64748b",margin:"0 12px"}}>Iscilik: </span><strong>{iT.toLocaleString("tr-TR")} TL</strong>
        <span style={{color:"#64748b",margin:"0 12px"}}>Toplam: </span><strong style={{fontSize:16,color:"#2563eb"}}>{(pT+iT).toLocaleString("tr-TR")} TL</strong>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button disabled={load} onClick={()=>kaydet()} style={{padding:"9px 20px",background:"#64748b",color:"#fff",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer"}}>Taslak Kaydet</button>
        <button disabled={load} onClick={()=>kaydet("eksper_bekliyor")} style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer"}}>Ekspere Gonder</button>
      </div>
    </div>
  </div>)
}
