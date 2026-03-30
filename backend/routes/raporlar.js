const express = require('express');
const router = express.Router();
const db = require('../db');

function donemFilter(yil, ay) {
  if (ay) return { where: "strftime('%Y-%m', fatura_tarihi) = ?", params: [`${yil}-${String(ay).padStart(2,'0')}`] };
  return { where: "strftime('%Y', fatura_tarihi) = ?", params: [String(yil)] };
}

router.get('/kpi', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const ay = req.query.ay || null;
  const { where, params } = donemFilter(yil, ay);

  const toplamCiro = db.prepare("SELECT COALESCE(SUM(genel_toplam),0) as val FROM faturalar").get().val;
  const bekleyenTahsilat = db.prepare("SELECT COALESCE(SUM(genel_toplam - odenen_tutar),0) as val FROM faturalar WHERE odeme_durumu != 'odendi'").get().val;
  const donemGiris = db.prepare(`SELECT COUNT(*) as val FROM faturalar WHERE ${where}`).get(...params).val;
  const donemCiro = db.prepare(`SELECT COALESCE(SUM(genel_toplam),0) as val FROM faturalar WHERE ${where}`).get(...params).val;
  const donemParca = db.prepare(`SELECT COALESCE(SUM(yedek_parca_net),0) as val FROM faturalar WHERE ${where}`).get(...params).val;
  const donemIscilik = db.prepare(`SELECT COALESCE(SUM(iscilik_net),0) as val FROM faturalar WHERE ${where}`).get(...params).val;

  res.json({ toplamCiro, bekleyenTahsilat, buAyGiris: donemGiris, buAyCiro: donemCiro, buAyParca: donemParca, buAyIscilik: donemIscilik });
});

router.get('/aylik-marka', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fatura_tarihi) as ay, marka, COUNT(*) as adet
    FROM faturalar WHERE ${where} AND marka IS NOT NULL
    GROUP BY ay, marka ORDER BY ay
  `).all(...params);
  res.json(rows);
});

router.get('/aylik-tutarlar', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fatura_tarihi) as ay,
      COALESCE(SUM(yedek_parca_net),0) as yedek_parca,
      COALESCE(SUM(iscilik_net),0) as iscilik,
      COALESCE(SUM(genel_toplam),0) as toplam
    FROM faturalar WHERE ${where}
    GROUP BY ay ORDER BY ay
  `).all(...params);
  res.json(rows);
});

router.get('/odeme-ozet', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT odeme_durumu,
      COUNT(*) as adet,
      COALESCE(SUM(genel_toplam),0) as toplam_tutar,
      COALESCE(SUM(odenen_tutar),0) as odenen_tutar
    FROM faturalar WHERE ${where}
    GROUP BY odeme_durumu
  `).all(...params);
  res.json(rows);
});

router.get('/marka-tutarlar', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT marka,
      COUNT(*) as adet,
      COALESCE(SUM(yedek_parca_net),0) as yedek_parca,
      COALESCE(SUM(iscilik_net),0) as iscilik,
      COALESCE(SUM(genel_toplam),0) as toplam
    FROM faturalar WHERE ${where} AND marka IS NOT NULL
    GROUP BY marka ORDER BY toplam DESC
  `).all(...params);
  res.json(rows);
});

router.get('/aylik-marka-tutarlar', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fatura_tarihi) as ay, marka,
      COUNT(*) as adet,
      COALESCE(SUM(yedek_parca_net),0) as yedek_parca,
      COALESCE(SUM(iscilik_net),0) as iscilik,
      COALESCE(SUM(genel_toplam),0) as toplam
    FROM faturalar WHERE ${where} AND marka IS NOT NULL
    GROUP BY ay, marka ORDER BY ay
  `).all(...params);
  res.json(rows);
});

router.get('/eksik-odemeler', (req, res) => {
  const rows = db.prepare(`
    SELECT id, fatura_no, dosya_no, musteri_adi, marka, plaka, fatura_tarihi,
      genel_toplam, odenen_tutar,
      (genel_toplam - odenen_tutar) as eksik_tutar,
      odeme_durumu
    FROM faturalar WHERE odeme_durumu != 'odendi'
    ORDER BY eksik_tutar DESC LIMIT 10
  `).all();
  res.json(rows);
});

router.get('/ciro-trendi', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fatura_tarihi) as ay,
      COALESCE(SUM(genel_toplam),0) as ciro
    FROM faturalar WHERE ${where}
    GROUP BY ay ORDER BY ay
  `).all(...params);
  res.json(rows);
});

router.get('/sigorta-ozet', (req, res) => {
  const yil = req.query.yil || new Date().getFullYear();
  const { where, params } = donemFilter(yil, req.query.ay);
  const rows = db.prepare(`
    SELECT COALESCE(sigorta_sirketi, 'Belirtilmemiş') as sigorta_sirketi,
      COUNT(*) as adet,
      COALESCE(SUM(yedek_parca_net),0) as yedek_parca,
      COALESCE(SUM(iscilik_net),0) as iscilik,
      COALESCE(SUM(genel_toplam),0) as toplam
    FROM faturalar WHERE ${where}
    GROUP BY sigorta_sirketi ORDER BY toplam DESC
  `).all(...params);
  res.json(rows);
});

module.exports = router;
