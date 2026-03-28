const db = require('./db');

// marka-tutarlar test
const r1 = db.prepare("SELECT marka, COUNT(*) as adet, COALESCE(SUM(yedek_parca_net),0) as yedek_parca, COALESCE(SUM(iscilik_net),0) as iscilik, COALESCE(SUM(genel_toplam),0) as toplam FROM faturalar WHERE strftime('%Y', fatura_tarihi) = '2026' AND marka IS NOT NULL GROUP BY marka ORDER BY toplam DESC").all();
console.log('marka-tutarlar (yil=2026):', JSON.stringify(r1));

// aylik-marka-tutarlar test
const r2 = db.prepare("SELECT strftime('%Y-%m', fatura_tarihi) as ay, marka, COUNT(*) as adet, COALESCE(SUM(yedek_parca_net),0) as yedek_parca, COALESCE(SUM(iscilik_net),0) as iscilik FROM faturalar WHERE strftime('%Y', fatura_tarihi) = '2026' AND marka IS NOT NULL GROUP BY ay, marka ORDER BY ay").all();
console.log('aylik-marka-tutarlar (yil=2026):', JSON.stringify(r2));

// ay=03 test
const r3 = db.prepare("SELECT marka, COUNT(*) as adet, COALESCE(SUM(yedek_parca_net),0) as yedek_parca FROM faturalar WHERE strftime('%Y-%m', fatura_tarihi) = '2026-03' AND marka IS NOT NULL GROUP BY marka").all();
console.log('marka-tutarlar (ay=03):', JSON.stringify(r3));
