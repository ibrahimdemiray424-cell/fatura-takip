const express    = require("express");
const router     = express.Router();
const db         = require("../db");
const ExcelJS    = require("exceljs");
const PDFDocument = require("pdfkit");

const IST_COLS = ["ONARIM","KAPORTA","BOYA","ELEKTRIK","TRIMQ","CAM","DIGER"];

function getDosya(id) {
  const d = db.prepare("SELECT * FROM ekspertiz_dosyalari WHERE id=?").get(id);
  if (!d) return null;
  d.parcalar    = db.prepare("SELECT * FROM ekspertiz_parcalar    WHERE dosya_id=? ORDER BY kaynak,id").all(id);
  d.iscilikleri = db.prepare("SELECT * FROM ekspertiz_iscilikleri WHERE dosya_id=? ORDER BY kaynak,parca_adi,id").all(id);
  return d;
}

function raporNo() {
  const n = new Date();
  const pre = `EKS-${n.getFullYear()}${String(n.getMonth()+1).padStart(2,"0")}`;
  const last = db.prepare("SELECT rapor_no FROM ekspertiz_dosyalari WHERE rapor_no LIKE ? ORDER BY id DESC LIMIT 1").get(`${pre}%`);
  if (!last) return `${pre}-001`;
  return `${pre}-${String(parseInt(last.rapor_no.split("-").pop())+1).padStart(3,"0")}`;
}

const GECISLER = {
  taslak           :["eksper_bekliyor"],
  eksper_bekliyor  :["eksper_onaylandi",'taslak'],
  eksper_onaylandi :["kaporta_surecinde","boya_surecinde","tamamlandi"],
  kaporta_surecinde:["boya_surecinde","tamamlandi"],
  boya_surecinde   :["kaporta_surecinde","tamamlandi"],
  tamamlandi       :[],
};

function hesapla(dosya) {
  const pE=(dosya.parcalar||[]).filter(p=>p.kaynak!=="atolye").reduce((a,p)=>a+(p.fiyat||0),0);
  const pA=(dosya.parcalar||[]).filter(p=>p.kaynak==="atolye").reduce((a,p)=>a+(p.fiyat||0),0);
  const iE=(dosya.iscilikleri||[]).filter(i=>i.kaynak!=="atolye").reduce((a,i)=>a+(i.tutar||0),0);
  const iA=(dosya.iscilikleri||[]).filter(i=>i.kaynak==="atolye").reduce((a,i)=>a+(i.tutar||0),0);
  return {pE,pA,iE,iA,genel:pE+pA+iE+iA};
}

// iscilikleri listesinden matris satırları üret
function iscilikMatris(list) {
  const satirlar = [...new Set(list.map(i=>i.parca_adi).filter(Boolean))];
  return satirlar.map(parca => {
    const row = { parca };
    let top = 0;
    for (const tip of IST_COLS) {
      const is = list.find(i=>i.parca_adi===parca && i.iscilik_tipi===tip);
      const v  = is ? (Number(is.tutar)||0) : 0;
      row[tip] = v;
      top += v;
    }
    row["TOPLAM"] = top;
    return row;
  });
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const { ara, durum } = req.query;
  let sql = "SELECT * FROM ekspertiz_dosyalari WHERE 1=1";
  const p = [];
  if (ara)   { sql += " AND (plaka LIKE ? OR rapor_no LIKE ? OR musteri_adi LIKE ?)"; p.push(`%${ara}%`,`%${ara}%`,`%${ara}%`); }
  if (durum) { sql += " AND durum=?"; p.push(durum); }
  sql += " ORDER BY id DESC";
  res.json(db.prepare(sql).all(...p));
});

router.get("/:id", (req, res) => {
  const d = getDosya(req.params.id);
  if (!d) return res.status(404).json({error:"Bulunamadi"});
  res.json(d);
});

router.post("/", (req, res) => {
  const { parcalar=[], iscilikleri=[], ...f } = req.body;
  const rapor_no = f.rapor_no || raporNo();
  const now = new Date().toISOString();
  const id = db.prepare(`INSERT INTO ekspertiz_dosyalari
    (rapor_no,plaka,marka_model,yil,renk,sasi_no,motor_no,km,yakit_turu,
     musteri_adi,musteri_tel,sigorta_sirketi,police_no,hasar_tarihi,ihbar_tarihi,
     durum,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'taslak',?,?)`
  ).run(rapor_no,f.plaka,f.marka_model,f.yil,f.renk,f.sasi_no,f.motor_no,f.km,f.yakit_turu,
        f.musteri_adi,f.musteri_tel,f.sigorta_sirketi,f.police_no,f.hasar_tarihi,f.ihbar_tarihi,now,now).lastInsertRowid;
  _ins(id,parcalar,iscilikleri);
  res.json(getDosya(id));
});

router.put("/:id", (req, res) => {
  const id = req.params.id;
  if (!db.prepare("SELECT id FROM ekspertiz_dosyalari WHERE id=?").get(id))
    return res.status(404).json({error:"Bulunamadi"});
  const { parcalar=[], iscilikleri=[], ...f } = req.body;
  const now = new Date().toISOString();
  db.prepare(`UPDATE ekspertiz_dosyalari SET plaka=?,marka_model=?,yil=?,renk=?,sasi_no=?,motor_no=?,km=?,yakit_turu=?,
    musteri_adi=?,musteri_tel=?,sigorta_sirketi=?,police_no=?,hasar_tarihi=?,ihbar_tarihi=?,updated_at=? WHERE id=?`)
    .run(f.plaka,f.marka_model,f.yil,f.renk,f.sasi_no,f.motor_no,f.km,f.yakit_turu,
         f.musteri_adi,f.musteri_tel,f.sigorta_sirketi,f.police_no,f.hasar_tarihi,f.ihbar_tarihi,now,id);
  db.prepare("DELETE FROM ekspertiz_parcalar    WHERE dosya_id=? AND kaynak='ekspertiz'").run(id);
  db.prepare("DELETE FROM ekspertiz_iscilikleri WHERE dosya_id=? AND kaynak='ekspertiz'").run(id);
  _ins(id,parcalar,iscilikleri);
  res.json(getDosya(id));
});

function _ins(id,parcalar,iscilikleri){
  const ip=db.prepare("INSERT INTO ekspertiz_parcalar (dosya_id,parca_adi,hasar_durumu,parca_no,fiyat,kaynak) VALUES (?,?,?,?,?,?)");
  const ii=db.prepare("INSERT INTO ekspertiz_iscilikleri (dosya_id,parca_adi,iscilik_tipi,tutar,kaynak) VALUES (?,?,?,?,?)");
  for (const p of parcalar)    ip.run(id,p.parca_adi,p.hasar_durumu,p.parca_no,p.fiyat||0,"ekspertiz");
  for (const i of iscilikleri) ii.run(id,i.parca_adi,i.iscilik_tipi,i.tutar||0,"ekspertiz");
}

router.delete("/:id", (req, res) => {
  const id=req.params.id;
  db.prepare("DELETE FROM ekspertiz_parcalar    WHERE dosya_id=?").run(id);
  db.prepare("DELETE FROM ekspertiz_iscilikleri WHERE dosya_id=?").run(id);
  db.prepare("DELETE FROM ekspertiz_dosyalari   WHERE id=?").run(id);
  res.json({ok:true});
});

router.patch("/:id/durum", (req, res) => {
  const id=req.params.id;
  const dosya=db.prepare("SELECT * FROM ekspertiz_dosyalari WHERE id=?").get(id);
  if (!dosya) return res.status(404).json({error:"Bulunamadi"});
  const {durum,eksper_adi,eksper_notu}=req.body;
  if (!(GECISLER[dosya.durum]||[]).includes(durum))
    return res.status(400).json({error:`${dosya.durum} -> ${durum} gecisine izin verilmiyor`});
  const now=new Date().toISOString();
  const upd={durum,updated_at:now};
  if (durum==="eksper_onaylandi"){upd.eksper_adi=eksper_adi;upd.eksper_notu=eksper_notu;upd.eksper_tarih=now;}
  if (durum==='taslak')          {upd.eksper_adi=null;upd.eksper_notu=null;upd.eksper_tarih=null;}
  const sets=Object.keys(upd).map(k=>`${k}=?`).join(",");
  db.prepare(`UPDATE ekspertiz_dosyalari SET ${sets} WHERE id=?`).run(...Object.values(upd),id);
  res.json(getDosya(id));
});

router.post("/:id/atolye", (req, res) => {
  const id=req.params.id;
  const dosya=db.prepare("SELECT * FROM ekspertiz_dosyalari WHERE id=?").get(id);
  if (!dosya) return res.status(404).json({error:"Bulunamadi"});
  if (!["eksper_onaylandi","kaporta_surecinde","boya_surecinde"].includes(dosya.durum))
    return res.status(400).json({error:"Bu durumda atolye kalemi eklenemez"});
  const {tip,parca_adi,hasar_durumu,parca_no,fiyat,iscilik_tipi,tutar}=req.body;
  if (tip==="parca")
    db.prepare("INSERT INTO ekspertiz_parcalar    (dosya_id,parca_adi,hasar_durumu,parca_no,fiyat,kaynak) VALUES (?,?,?,?,?,?)").run(id,parca_adi,hasar_durumu||"",parca_no||"",fiyat||0,"atolye");
  else
    db.prepare("INSERT INTO ekspertiz_iscilikleri (dosya_id,parca_adi,iscilik_tipi,tutar,kaynak) VALUES (?,?,?,?,?)").run(id,parca_adi,iscilik_tipi||"",tutar||0,"atolye");
  db.prepare("UPDATE ekspertiz_dosyalari SET updated_at=? WHERE id=?").run(new Date().toISOString(),id);
  res.json(getDosya(id));
});

router.delete("/:id/parca/:pid",   (req,res)=>{ db.prepare("DELETE FROM ekspertiz_parcalar    WHERE id=? AND dosya_id=?").run(req.params.pid,req.params.id); res.json(getDosya(req.params.id)); });
router.delete("/:id/iscilik/:iid", (req,res)=>{ db.prepare("DELETE FROM ekspertiz_iscilikleri WHERE id=? AND dosya_id=?").run(req.params.iid,req.params.id); res.json(getDosya(req.params.id)); });

// ─── Excel ───────────────────────────────────────────────────────────────────
router.get("/:id/excel", async (req, res) => {
  const dosya=getDosya(req.params.id);
  if (!dosya) return res.status(404).json({error:"Bulunamadi"});
  const {pE,pA,iE,iA,genel}=hesapla(dosya);

  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet("Ekspertiz",{pageSetup:{paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:1}});

  const blk="FF000000",hbg="FF1F3864",hfg="FFFFFFFF",sbg="FFBDD7EE",thbg="FF2E75B6",thbg2="FF334155",alt="FFDEEAF1",lbl="FFF2F2F2",yel="FFFBBF24",grn="FF34D399";
  const thinS={style:"thin",color:{argb:blk}};
  const B=()=>({top:thinS,bottom:thinS,left:thinS,right:thinS});
  function mc(r,c1,c2,val,o={}){
    if(c1!==c2) ws.mergeCells(r,c1,r,c2);
    const cell=ws.getCell(r,c1); cell.value=val;
    cell.font={name:"Calibri",bold:o.bold||false,size:o.size||9,color:{argb:o.fg||blk}};
    if(o.bg) cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:o.bg}};
    cell.alignment={horizontal:o.h||"left",vertical:"middle",wrapText:o.wrap||false};
    cell.border=B();
  }

  // Toplam sütun sayısı: 1(parça) + 4(araçbilgi) + IST_COLS(7) + 1(toplam) = esneyebilir
  // Basit layout: A-B araç bilgi sol, devamı sağ, sonra işçilik matrisi
  const TOTAL_COLS = 2 + IST_COLS.length + 1; // 10
  ws.columns = [
    {width:2},    // A margin
    {width:22},   // B parça / label
    {width:12},   // C
    {width:12},   // D
    {width:12},   // E
    {width:10},   // F ONARIM
    {width:10},   // G KAPORTA
    {width:10},   // H BOYA
    {width:10},   // I ELEKTRİK
    {width:10},   // J TRİMQ
    {width:10},   // K CAM
    {width:10},   // L DİĞER
    {width:10},   // M TOPLAM
    {width:2},    // N margin
  ];

  let r=1;
  ws.getRow(r).height=5; r++;
  ws.getRow(r).height=32;
  mc(r,1,13,"ARAÇ ÖN HASAR EKSPERTİZ FORMU",{bold:true,size:15,fg:hfg,bg:hbg,h:"center"}); r++;
  ws.getRow(r).height=16;
  mc(r,1,4,`Rapor No: ${dosya.rapor_no||""}`,{bold:true,bg:lbl});
  mc(r,5,8,`Tarih: ${dosya.created_at?.split("T")[0]||""}`,{bg:lbl});
  mc(r,9,13,`Durum: ${dosya.durum||""}`,{bg:lbl}); r++;
  ws.getRow(r).height=5; r++;

  // Araç bilgileri
  ws.getRow(r).height=16; mc(r,1,13,"ARAÇ BİLGİLERİ",{bold:true,size:10,bg:sbg}); r++;
  [[dosya.plaka,"Plaka",dosya.marka_model,"Marka/Model"],[dosya.yil,"Yıl",dosya.renk,"Renk"],[dosya.sasi_no,"Şase",dosya.motor_no,"Motor"],[dosya.km,"KM",dosya.yakit_turu,"Yakıt"]].forEach(([v1,l1,v2,l2])=>{
    ws.getRow(r).height=16;
    mc(r,1,1,l1,{bold:true,bg:lbl}); mc(r,2,6,v1||"");
    mc(r,7,7,l2,{bold:true,bg:lbl}); mc(r,8,13,v2||""); r++;
  });
  ws.getRow(r).height=5; r++;

  // Parçalar tablosu
  ws.getRow(r).height=16; mc(r,1,13,"PARÇALAR",{bold:true,size:10,bg:sbg}); r++;
  ws.getRow(r).height=16;
  mc(r,1,5,"Parça Adı",{bold:true,fg:hfg,bg:thbg2}); mc(r,6,8,"Hasar Durumu",{bold:true,fg:hfg,bg:thbg2,h:"center"}); mc(r,9,10,"Parça No",{bold:true,fg:hfg,bg:thbg2,h:"center"}); mc(r,11,13,"Fiyat (TL)",{bold:true,fg:hfg,bg:thbg2,h:"right"}); r++;
  dosya.parcalar.forEach((p,i)=>{
    const bg=i%2===0?alt:"FFFFFFFF"; ws.getRow(r).height=15;
    mc(r,1,5,p.parca_adi||"",{bg}); mc(r,6,8,p.hasar_durumu||"",{bg,h:"center"}); mc(r,9,10,p.parca_no||"",{bg,h:"center"}); mc(r,11,13,p.fiyat||0,{bg,h:"right"}); r++;
  });
  ws.getRow(r).height=16;
  mc(r,1,10,"Parça Toplamı",{bold:true,bg:lbl}); mc(r,11,13,pE+pA,{bold:true,h:"right"}); r++;
  ws.getRow(r).height=5; r++;

  // İşçilik Matrisi
  const eksMatris = iscilikMatris((dosya.iscilikleri||[]).filter(i=>i.kaynak!=="atolye"));
  const atoMatris = iscilikMatris((dosya.iscilikleri||[]).filter(i=>i.kaynak==="atolye"));

  function yazMatris(list, baslik) {
    if (!list.length) return;
    ws.getRow(r).height=16; mc(r,1,13,baslik,{bold:true,size:10,bg:sbg}); r++;
    // Başlık satırı
    ws.getRow(r).height=18;
    mc(r,1,3,"PARÇA",{bold:true,fg:hfg,bg:thbg2});
    IST_COLS.forEach((tip,ci)=>{ const col=4+ci; mc(r,col,col,tip,{bold:true,fg:"FFFFFFFF",bg:thbg,h:"center"}); });
    mc(r,11,13,"SATIR TOPLAMARI",{bold:true,fg:yel,bg:thbg2,h:"center"}); r++;

    // Veri satırları
    list.forEach((row,ri)=>{
      const bg=ri%2===0?alt:"FFFFFFFF"; ws.getRow(r).height=15;
      mc(r,1,3,row.parca,{bg,bold:true});
      IST_COLS.forEach((tip,ci)=>{
        const col=4+ci; const v=row[tip]||0;
        mc(r,col,col,v>0?v:"",{bg,h:"right"});
      });
      mc(r,11,13,row.TOPLAM>0?row.TOPLAM:"",{bg,h:"right",bold:true}); r++;
    });
    // Sütun toplamları
    ws.getRow(r).height=16;
    mc(r,1,3,"SÜTUN TOPLAMI",{bold:true,fg:hfg,bg:"FF1e293b"});
    let genTop=0;
    IST_COLS.forEach((tip,ci)=>{
      const col=4+ci;
      const v=list.reduce((a,row)=>a+(row[tip]||0),0); genTop+=v;
      mc(r,col,col,v>0?v:"",{bold:true,fg:v>0?yel:blk,bg:"FF1e293b",h:"right"});
    });
    mc(r,11,13,genTop>0?genTop:"",{bold:true,fg:grn,bg:"FF1e293b",h:"right",size:10}); r++;
    ws.getRow(r).height=5; r++;
  }

  yazMatris(eksMatris,"İŞÇİLİK KALEMLERİ — EKSPERTİZ");
  if (atoMatris.length) yazMatris(atoMatris,"İŞÇİLİK KALEMLERİ — ATÖLYE");

  // Genel toplam
  [["Ekspertiz Parça",pE],["Atölye Parça",pA],["Ekspertiz İşçilik",iE],["Atölye İşçilik",iA]].forEach(([l,v])=>{
    ws.getRow(r).height=16; mc(r,1,11,l,{bold:true,bg:lbl}); mc(r,12,13,v,{bold:true,h:"right"}); r++;
  });
  ws.getRow(r).height=20; mc(r,1,11,"GENEL TOPLAM",{bold:true,size:11,fg:hfg,bg:hbg}); mc(r,12,13,genel,{bold:true,size:11,fg:hfg,bg:hbg,h:"right"}); r++;

  ws.pageSetup.printArea=`A1:N${r}`;
  ws.pageSetup.margins={left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2};
  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",`attachment; filename="ekspertiz-${dosya.rapor_no}.xlsx"`);
  await wb.xlsx.write(res); res.end();
});

// ─── PDF ─────────────────────────────────────────────────────────────────────
router.get("/:id/pdf", (req, res) => {
  const dosya=getDosya(req.params.id);
  if (!dosya) return res.status(404).json({error:"Bulunamadi"});
  const {pE,pA,iE,iA,genel}=hesapla(dosya);
  const DURUM_TR={taslak:"Taslak",eksper_bekliyor:"Eksper Bekliyor",eksper_onaylandi:"Eksper Onayladi",kaporta_surecinde:"Kaporta Surecinde",boya_surecinde:"Boya Surecinde",tamamlandi:"Tamamlandi"};

  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition",`attachment; filename="ekspertiz-${dosya.rapor_no}.pdf"`);

  const doc=new PDFDocument({size:"A4",layout:"landscape",margin:30});
  doc.pipe(res);

  const PW=782, PH=555; // landscape A4 kullanılabilir alan (~30mm margin)
  let Y=30;

  const C={hdr:"#1F3864",sub:"#BDD7EE",thDark:"#334155",thBlue:"#2E75B6",alt:"#DEEAF1",lbl:"#F2F2F2",yel:"#FBBF24",grn:"#34D399"};

  function rect(x,y,w,h,fill,stroke=null){
    doc.rect(x,y,w,h).fillColor(fill).fill();
    if(stroke){ doc.rect(x,y,w,h).strokeColor(stroke).lineWidth(0.3).stroke(); }
  }
  function text(txt,x,y,w,o={}){
    doc.fontSize(o.size||8).fillColor(o.color||"#000000").font(o.bold?"Helvetica-Bold":"Helvetica")
       .text(String(txt||""),x,y,{width:w,height:o.h||14,ellipsis:true,align:o.align||"left",lineBreak:false});
  }
  function pageCheck(need=20){ if(Y+need>PH){ doc.addPage({size:"A4",layout:"landscape",margin:30}); Y=30; } }

  // Başlık
  rect(30,Y,PW,28,C.hdr); text("ARAC ON HASAR EKSPERTIZ FORMU",30,Y+7,PW,{bold:true,size:14,color:"#FFFFFF",align:"center"}); Y+=34;

  // Rapor bilgileri
  pageCheck(18);
  [["Rapor No: "+(dosya.rapor_no||""),PW/3],["Tarih: "+(dosya.created_at?.split("T")[0]||""),PW/3],["Durum: "+(DURUM_TR[dosya.durum]||dosya.durum||""),PW/3]].forEach(([t,w],i)=>{
    rect(30+i*(PW/3),Y,PW/3,18,C.lbl,"#CBD5E1"); text(t,34+i*(PW/3),Y+4,PW/3-8,{bold:true});
  }); Y+=24;

  // Araç bilgileri
  pageCheck(16);
  rect(30,Y,PW,16,C.sub); text("ARAC BILGILERI",34,Y+3,PW,{bold:true,size:9}); Y+=20;
  const aracFields=[[["Plaka",dosya.plaka],["Marka/Model",dosya.marka_model]],[["Yil",dosya.yil],["Renk",dosya.renk]],[["Sase No",dosya.sasi_no],["Motor No",dosya.motor_no]],[["KM",dosya.km],["Yakit",dosya.yakit_turu]]];
  const hw=PW/2;
  aracFields.forEach(pair=>{
    pageCheck(16);
    pair.forEach(([l,v],i)=>{
      rect(30+i*hw,Y,hw/3,16,C.lbl,"#CBD5E1"); text(l,34+i*hw,Y+4,hw/3-8,{bold:true});
      rect(30+i*hw+hw/3,Y,hw*2/3,16,"#FFFFFF","#CBD5E1"); text(String(v||""),34+i*hw+hw/3,Y+4,hw*2/3-8);
    }); Y+=16;
  }); Y+=8;

  // Parçalar
  pageCheck(16);
  rect(30,Y,PW,16,C.sub); text("PARCALAR",34,Y+3,PW,{bold:true,size:9}); Y+=20;
  const pColW=[PW*0.35,PW*0.2,PW*0.2,PW*0.25];
  pageCheck(16);
  [["Parca Adi","left"],["Hasar Durumu","center"],["Parca No","center"],["Fiyat (TL)","right"]].forEach(([h,al],ci)=>{
    const x=30+pColW.slice(0,ci).reduce((a,w)=>a+w,0);
    rect(x,Y,pColW[ci],16,C.thDark,"#475569"); text(h,x+3,Y+4,pColW[ci]-6,{bold:true,color:"#FFFFFF",align:al});
  }); Y+=16;
  dosya.parcalar.forEach((p,ri)=>{
    pageCheck(15);
    const bg=ri%2===0?C.alt:"#FFFFFF";
    [[p.parca_adi,"left"],[p.hasar_durumu,"center"],[p.parca_no,"center"],[(p.fiyat||0).toLocaleString("tr-TR"),"right"]].forEach(([v,al],ci)=>{
      const x=30+pColW.slice(0,ci).reduce((a,w)=>a+w,0);
      rect(x,Y,pColW[ci],15,ci===0?"#E8EDF2":bg,"#CBD5E1"); text(String(v||""),x+3,Y+3,pColW[ci]-6,{align:al,bold:ci===0});
    }); Y+=15;
  }); Y+=8;

  // İşçilik matrisi çizme fonksiyonu
  function drawIscilikMatris(list, baslik) {
    if (!list.length) return;
    pageCheck(16);
    rect(30,Y,PW,16,C.sub); text(baslik,34,Y+3,PW,{bold:true,size:9}); Y+=20;

    // Sütun genişlikleri: PARÇA(180) + 7 tip (her biri ~70) + TOPLAM(80) = 180+490+80=750... PW=782
    const parcaW = 160;
    const tipW   = Math.floor((PW - parcaW - 80) / IST_COLS.length); // ~77
    const topW   = PW - parcaW - tipW*IST_COLS.length;

    // Başlık satırı
    pageCheck(20);
    rect(30,Y,parcaW,20,C.thDark,"#475569"); text("PARÇA",33,Y+5,parcaW-6,{bold:true,color:"#FFFFFF"});
    IST_COLS.forEach((tip,ci)=>{
      const x=30+parcaW+ci*tipW;
      rect(x,Y,tipW,20,C.thBlue,"#475569"); text(tip,x+2,Y+5,tipW-4,{bold:true,color:"#FFFFFF",align:"center"});
    });
    const topX=30+parcaW+IST_COLS.length*tipW;
    rect(topX,Y,topW,20,C.thDark,"#475569"); text("SATIR TOP.",topX+2,Y+5,topW-4,{bold:true,color:C.yel,align:"right"});
    Y+=20;

    // Matris satırları
    const matrisRows = iscilikMatris(list);
    matrisRows.forEach((row,ri)=>{
      pageCheck(16);
      const bg=ri%2===0?C.alt:"#FFFFFF";
      rect(30,Y,parcaW,16,"#E8EDF2","#CBD5E1"); text(row.parca,33,Y+4,parcaW-6,{bold:true});
      IST_COLS.forEach((tip,ci)=>{
        const x=30+parcaW+ci*tipW; const v=row[tip]||0;
        rect(x,Y,tipW,16,bg,"#CBD5E1");
        if(v>0) text(v.toLocaleString("tr-TR"),x+2,Y+4,tipW-4,{align:"right",bold:true});
        else { doc.fontSize(7).fillColor("#CBD5E1").text("—",x+2,Y+5,{width:tipW-4,align:"center",lineBreak:false}); }
      });
      const topX=30+parcaW+IST_COLS.length*tipW;
      rect(topX,Y,topW,16,bg,"#CBD5E1");
      if(row.TOPLAM>0) text(row.TOPLAM.toLocaleString("tr-TR"),topX+2,Y+4,topW-4,{align:"right",bold:true,color:"#1D4ED8"});
      Y+=16;
    });

    // Sütun toplamları satırı
    pageCheck(18);
    rect(30,Y,parcaW,18,C.thDark,"#475569"); text("SÜTUN TOPLAMI",33,Y+4,parcaW-6,{bold:true,color:"#FFFFFF"});
    let genTop=0;
    IST_COLS.forEach((tip,ci)=>{
      const x=30+parcaW+ci*tipW; const v=list.reduce((a,r)=>a+(r[tip]||0),0); genTop+=v;
      rect(x,Y,tipW,18,C.thDark,"#475569");
      if(v>0) text(v.toLocaleString("tr-TR"),x+2,Y+5,tipW-4,{align:"right",bold:true,color:C.yel});
    });
    const topXS=30+parcaW+IST_COLS.length*tipW;
    rect(topXS,Y,topW,18,C.thDark,"#475569");
    text(genTop.toLocaleString("tr-TR")+" TL",topXS+2,Y+4,topW-4,{align:"right",bold:true,color:C.grn,size:9});
    Y+=24;
  }

  const eksIs=(dosya.iscilikleri||[]).filter(i=>i.kaynak!=="atolye");
  const atoIs=(dosya.iscilikleri||[]).filter(i=>i.kaynak==="atolye");
  drawIscilikMatris(eksIs,"ISCILIK KALEMLERI — EKSPERTIZ");
  if (atoIs.length) drawIscilikMatris(atoIs,"ISCILIK KALEMLERI — ATOLYE");

  // Toplamlar
  pageCheck(100);
  [["Ekspertiz Parca Toplami",pE],["Atolye Parca Toplami",pA],["Ekspertiz Iscilik Toplami",iE],["Atolye Iscilik Toplami",iA]].forEach(([l,v])=>{
    rect(30,Y,PW-80,18,C.lbl,"#CBD5E1"); text(l,34,Y+4,PW-90,{bold:true});
    rect(30+PW-80,Y,80,18,C.lbl,"#CBD5E1"); text((v||0).toLocaleString("tr-TR")+" TL",32+PW-80,Y+4,74,{align:"right",bold:true}); Y+=18;
  });
  rect(30,Y,PW,22,C.hdr); text("GENEL TOPLAM",34,Y+6,PW-90,{bold:true,size:10,color:"#FFFFFF"});
  text(genel.toLocaleString("tr-TR")+" TL",34,Y+6,PW-10,{bold:true,size:11,color:C.grn,align:"right"}); Y+=28;

  // Eksper notu
  if (dosya.eksper_adi) {
    pageCheck(20);
    rect(30,Y,PW,20,"#F0FDF4","#86EFAC");
    text("Eksper Onayi: "+dosya.eksper_adi+(dosya.eksper_notu?" — "+dosya.eksper_notu:""),34,Y+5,PW-8,{bold:true,color:"#166534"});
    Y+=24;
  }

  doc.end();
});

module.exports = router;




