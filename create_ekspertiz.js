const ExcelJS = require('exceljs');
const path = require('path');

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Ön Hasar Ekspertiz', {
  pageSetup: {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  }
});

// Sütunlar: A(margin) B(PNo-Sol) C(PAdı-Sol) D(Fiyat-Sol) E(sep) F(PNo-Sağ) G(PAdı-Sağ) H(Fiyat-Sağ) I(sep) J(InfoLabel) K(InfoValue) L(margin)
ws.columns = [
  { width: 1 },    // A
  { width: 5 },    // B - Parça No Sol
  { width: 14 },   // C - Parça Adı Sol
  { width: 8 },    // D - Fiyatı Sol
  { width: 1.5 },  // E - ayraç
  { width: 5 },    // F - Parça No Sağ
  { width: 14 },   // G - Parça Adı Sağ
  { width: 8 },    // H - Fiyatı Sağ
  { width: 1.5 },  // I - ayraç
  { width: 12 },   // J - Info Label / Hizmet Kalem
  { width: 9 },    // K - Info Value / Tutar
  { width: 1 },    // L - margin
];

const C = {
  darkBlue : 'FF1F3864',
  red      : 'FFCC0000',
  white    : 'FFFFFFFF',
  lightBlue: 'FFBDD7EE',
  tableHdr : 'FF2E75B6',
  altRow   : 'FFDEEAF1',
  labelBg  : 'FFF2F2F2',
  yellow   : 'FFFFFF99',
  black    : 'FF000000',
};

const thinSide = { style: 'thin', color: { argb: C.black } };
const thickSide = { style: 'medium', color: { argb: C.black } };

function borders(cell, thick = false) {
  const s = thick ? thickSide : thinSide;
  cell.border = { top: s, bottom: s, left: s, right: s };
}

function applyStyle(cell, { bold=false, size=9, fg=C.black, bg=null, h='left', v='middle', wrap=false, thick=false }={}) {
  cell.font = { name: 'Calibri', bold, size, color: { argb: fg } };
  if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.alignment = { horizontal: h, vertical: v, wrapText: wrap };
  borders(cell, thick);
}

// Hücre birleştir + değer + stil
function mc(r, c1, c2, val, opts={}) {
  if (c1 !== c2) ws.mergeCells(r, c1, r, c2);
  const cell = ws.getCell(r, c1);
  cell.value = val;
  applyStyle(cell, opts);
  return cell;
}

// Tek hücre
function sc(r, c, val, opts={}) {
  const cell = ws.getCell(r, c);
  cell.value = val;
  applyStyle(cell, opts);
  return cell;
}

let row = 1;

// ─────────────────────────────────────────────
// BAŞLIK SATIRI
// ─────────────────────────────────────────────
ws.getRow(row).height = 5; row++;

// Logo + Rapor No satırı
ws.getRow(row).height = 34;
mc(row, 1, 4, 'odak', { bold:true, size:20, fg:C.white, bg:C.darkBlue, h:'center', v:'middle', thick:true });
mc(row, 5, 8, '002138', { bold:true, size:20, fg:C.red, bg:'FFFAFAFA', h:'center', v:'middle', thick:true });
mc(row, 9, 12, 'www.odakotomariv.com\nTel: (0212) 449 13 13\nFax: (0212) 483 66 55', { size:7, fg:C.black, bg:'FFFAFAFA', h:'center', v:'middle', wrap:true });
row++;

// Adres satırı (sol)
ws.getRow(row).height = 13;
mc(row, 1, 8, 'Cevizlibağ Maltepe Mh. Londra Asfaltı Cad. Odak Plaza No:40/13A 34010 Zeytinburnu/İST.', { size:7.5, h:'center', v:'middle' });
mc(row, 9, 12, '', { bg:C.labelBg });
row++;

// Uyarı satırı (sol) + SN (sağ)
ws.getRow(row).height = 12;
mc(row, 1, 8, 'BU EKSPERTİZ BİR ÖN TAHMİNDİR, KESİN SONUÇ ONARIM NETİCESİNDE BELLİ OLUR. ARKASINDAKI ONARIM GENEL ŞARTLARINA DİKKAT EDİNİZ.',
  { bold:true, size:7, h:'center', v:'middle' });
sc(row, 9, 'SN.', { bold:true, size:8, bg:C.labelBg });
mc(row, 10, 12, '', { bg:C.labelBg });
row++;

// ─────────────────────────────────────────────
// CHECKBOX (sol) + ARAÇ BİLGİLERİ (sağ) bölümü
// ─────────────────────────────────────────────
ws.getRow(row).height = 16;
// Checkbox başlıkları
mc(row, 1, 2, 'EKİPMAN', { bold:true, size:8, bg:C.lightBlue, h:'center' });
sc(row, 3, 'VAR', { bold:true, size:8, bg:C.lightBlue, h:'center' });
sc(row, 4, 'YOK', { bold:true, size:8, bg:C.lightBlue, h:'center' });
mc(row, 5, 8, '', { bg:C.lightBlue });
// Araç bilgileri başlık
sc(row, 9, 'TELEFON', { bold:true, size:8, bg:C.labelBg });
mc(row, 10, 12, '', { size:8 });
row++;

const checkboxRows = [
  'SİGORTA', 'AIRBAG', 'KLİMA', 'SUNROOF',
  'R.E.T.', 'İMMOBİLİZER', 'ALARM', 'DERİ KOLTUK',
];
const vehicleFields = [
  'PLAKA NO', 'ARAÇ GELİŞ TARİHİ :', 'ŞASİ NO :',
  'MOTOR NO :', 'ARAÇ MODELİ :', 'KM/MİL :',
  'ARAÇ RENGİ :', 'TESBİT EDEN :',
];

for (let i = 0; i < 8; i++) {
  ws.getRow(row).height = 15;
  const bg = i % 2 === 0 ? C.altRow : C.white;
  mc(row, 1, 2, checkboxRows[i], { size:8, bg });
  sc(row, 3, '☐', { size:10, h:'center', bg });
  sc(row, 4, '☐', { size:10, h:'center', bg });
  mc(row, 5, 8, '', { bg });
  sc(row, 9, vehicleFields[i], { bold:true, size:8, bg:C.labelBg });
  mc(row, 10, 12, '', { size:8 });
  row++;
}

// KM satırı (son checkbox)
ws.getRow(row).height = 15;
mc(row, 1, 2, 'KM.', { size:8, bg:C.altRow });
mc(row, 3, 4, '', { size:8, bg:C.altRow, h:'center' });
mc(row, 5, 8, '', { bg:C.altRow });
mc(row, 9, 12, '', { bg:C.lightBlue });
row++;

ws.getRow(row).height = 5; row++;

// ─────────────────────────────────────────────
// PARÇA TABLOSU
// ─────────────────────────────────────────────
// TOPLAM gösterim satırı (üst)
ws.getRow(row).height = 18;
mc(row, 1, 3, 'TOPLAM', { bold:true, size:9, fg:C.white, bg:C.darkBlue, h:'right', v:'middle' });
sc(row, 4, '', { bold:true, size:9, bg:C.yellow, h:'right' });
mc(row, 5, 7, 'TOPLAM', { bold:true, size:9, fg:C.white, bg:C.darkBlue, h:'right', v:'middle' });
sc(row, 8, '', { bold:true, size:9, bg:C.yellow, h:'right' });
mc(row, 9, 12, '', { bg:C.darkBlue });
row++;

// Tablo sütun başlıkları
ws.getRow(row).height = 18;
sc(row, 1, 'PARÇA NO', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
sc(row, 2, 'PARÇA ADI', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
sc(row, 3, '', { bg:C.tableHdr });
sc(row, 4, 'FİYATI', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
sc(row, 5, 'PARÇA NO', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
sc(row, 6, 'PARÇA ADI', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
sc(row, 7, '', { bg:C.tableHdr });
sc(row, 8, 'FİYATI', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
mc(row, 9, 10, 'HİZMET KALEMİ', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
mc(row, 11, 12, 'TUTAR', { bold:true, size:8, fg:C.white, bg:C.tableHdr, h:'center' });
row++;

// Hizmet kalemleri (sağ sütunda gösterilecek)
const serviceItems = [
  'KAPORTA', 'BOYA', 'TİRİM-DÖŞEME', 'KİLİT-CAM',
  'MEKANİK', 'ELEKTRİK', 'CELET', 'KLİMA GAZİ',
  'ROTBALANS', 'TOP İŞÇİL',
];

// 20 parça satırı
for (let i = 0; i < 20; i++) {
  ws.getRow(row).height = 15;
  const bg = i % 2 === 0 ? C.altRow : C.white;

  sc(row, 1, '', { bg, h:'center' });
  sc(row, 2, '', { bg });
  sc(row, 3, '', { bg });
  sc(row, 4, '', { bg, h:'right' });
  sc(row, 5, '', { bg, h:'center' });
  sc(row, 6, '', { bg });
  sc(row, 7, '', { bg });
  sc(row, 8, '', { bg, h:'right' });

  if (i < serviceItems.length) {
    mc(row, 9, 10, serviceItems[i], { bold:true, size:8, bg:C.labelBg });
    mc(row, 11, 12, '', { size:8, h:'right' });
  } else if (i === serviceItems.length) {
    mc(row, 9, 10, 'YED. PARÇA TUTARI', { bold:true, size:8, bg:C.lightBlue });
    mc(row, 11, 12, '', { size:8, h:'right', bg:C.lightBlue });
  } else if (i === serviceItems.length + 1) {
    mc(row, 9, 10, 'TAHMİNİ TUTARI', { bold:true, size:8, fg:C.white, bg:C.darkBlue });
    mc(row, 11, 12, '', { size:9, h:'right', bg:C.yellow });
  } else {
    mc(row, 9, 12, '', { bg: i % 2 === 0 ? C.altRow : C.white });
  }
  row++;
}

// TOPLAM alt satırı
ws.getRow(row).height = 18;
mc(row, 1, 3, 'TOPLAM', { bold:true, size:9, fg:C.white, bg:C.darkBlue, h:'right', v:'middle' });
sc(row, 4, '', { bold:true, size:9, bg:C.yellow, h:'right', thick:true });
mc(row, 5, 7, 'TOPLAM', { bold:true, size:9, fg:C.white, bg:C.darkBlue, h:'right', v:'middle' });
sc(row, 8, '', { bold:true, size:9, bg:C.yellow, h:'right', thick:true });
mc(row, 9, 10, 'Müşteri:', { bold:true, size:9, bg:C.labelBg });
mc(row, 11, 12, '', { size:9 });
row++;

ws.getRow(row).height = 5; row++;

// ─────────────────────────────────────────────
// İMZA / EKSPER SATIRI
// ─────────────────────────────────────────────
ws.getRow(row).height = 45;
mc(row, 1, 8, 'Adı - Soyadı / İmza', { size:8, v:'bottom', h:'center' });
mc(row, 9, 10, 'Eksper Sn.:\nTelefon :\nZiyaret Tarihi :\nSon.Ziy.Tarihi :', { size:8, bg:C.labelBg, v:'top', wrap:true });
mc(row, 11, 12, '', { v:'top' });
row++;

ws.getRow(row).height = 5;

// ─────────────────────────────────────────────
// YAZDIRMA AYARLARI
// ─────────────────────────────────────────────
ws.pageSetup.printArea = `A1:L${row}`;
ws.pageSetup.margins = { left:0.4, right:0.4, top:0.5, bottom:0.5, header:0.2, footer:0.2 };
ws.sheetProperties = { pageSetUpPr: { fitToPage: true } };

const outPath = path.join(__dirname, 'on_hasar_ekspertiz.xlsx');
wb.xlsx.writeFile(outPath).then(() => {
  console.log('Kaydedildi:', outPath);
}).catch(err => console.error(err));
