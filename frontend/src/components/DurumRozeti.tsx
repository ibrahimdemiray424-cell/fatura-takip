interface Props { durum: string }
const MAP: Record<string,{label:string;bg:string;color:string}> = {
  taslak             :{label:"Taslak",            bg:"#e2e8f0",color:"#475569"},
  eksper_bekliyor    :{label:"Eksper Bekliyor",   bg:"#fef9c3",color:"#854d0e"},
  eksper_onaylandi   :{label:"Eksper Onayladi",   bg:"#dbeafe",color:"#1d4ed8"},
  kaporta_surecinde  :{label:"Kaporta Surecinde", bg:"#ffedd5",color:"#c2410c"},
  boya_surecinde     :{label:"Boya Surecinde",    bg:"#fce7f3",color:"#9d174d"},
  tamamlandi         :{label:"Tamamlandi",        bg:"#dcfce7",color:"#166534"},
}
export default function DurumRozeti({durum}:Props){
  const d=MAP[durum]||{label:durum,bg:"#f1f5f9",color:"#334155"}
  return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:d.bg,color:d.color}}>{d.label}</span>
}
