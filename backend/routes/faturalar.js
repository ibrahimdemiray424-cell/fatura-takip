const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { marka, odeme_durumu, tarih_baslangic, tarih_bitis, arama } = req.query;
  let query = 'SELECT * FROM faturalar WHERE 1=1';
  const params = [];
  if (marka) { query += ' AND UPPER(marka) = UPPER(?)'; params.push(marka); }
  if (odeme_durumu) { query += ' AND odeme_durumu = ?'; params.push(odeme_durumu); }
  if (tarih_baslangic) { query += ' AND fatura_tarihi >= ?'; params.push(tarih_baslangic); }
  if (tarih_bitis) { query += ' AND fatura_tarihi <= ?'; params.push(tarih_bitis); }
  if (arama) {
    query += ' AND (UPPER(dosya_no) LIKE UPPER(?) OR UPPER(plaka) LIKE UPPER(?))';
    params.push(`%${arama}%`, `%${arama}%`);
  }
  query += ' ORDER BY fatura_tarihi DESC, id DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/markalar', (req, res) => {
  res.json(['OPEL', 'PEUGEOT', 'HYUNDAİ', 'DİĞER']);
});

router.post('/', (req, res) => {
  const f = req.body;
  const odenenTutar = Number(f.odenen_tutar) || 0;
  const genelToplam = Number(f.genel_toplam) || 0;
  let odemeDurumu = f.odeme_durumu || 'bekliyor';
  if (odenenTutar <= 0) odemeDurumu = 'bekliyor';
  else if (odenenTutar >= genelToplam) odemeDurumu = 'odendi';
  else odemeDurumu = 'kismi';
  const stmt = db.prepare(`
    INSERT INTO faturalar (fatura_no, marka, plaka, yil, musteri_adi, dosya_no,
      yedek_parca_net, iscilik_net, genel_toplam, fatura_tarihi,
      odeme_durumu, odeme_tarihi, odenen_tutar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    f.fatura_no, f.marka, f.plaka || null, f.yil, f.musteri_adi, f.dosya_no,
    f.yedek_parca_net || 0, f.iscilik_net || 0, genelToplam,
    f.fatura_tarihi, odemeDurumu, f.odeme_tarihi || null, odenenTutar
  );
  const row = db.prepare('SELECT * FROM faturalar WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.post('/bulk', (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Array bekleniyor' });
  const stmt = db.prepare(`
    INSERT INTO faturalar (fatura_no, marka, plaka, yil, musteri_adi, dosya_no,
      yedek_parca_net, iscilik_net, genel_toplam, fatura_tarihi,
      odeme_durumu, odeme_tarihi, odenen_tutar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((items) => {
    for (const f of items) {
      const odenenTutar = Number(f.odenen_tutar) || 0;
      const genelToplam = Number(f.genel_toplam) || 0;
      let odemeDurumu = odenenTutar <= 0 ? 'bekliyor' : odenenTutar >= genelToplam ? 'odendi' : 'kismi';
      stmt.run(
        f.fatura_no, f.marka, f.plaka || null, f.yil, f.musteri_adi, f.dosya_no,
        f.yedek_parca_net || 0, f.iscilik_net || 0, genelToplam,
        f.fatura_tarihi, odemeDurumu, f.odeme_tarihi || null, odenenTutar
      );
    }
  });
  insertMany(rows);
  res.json({ inserted: rows.length });
});

router.put('/:id', (req, res) => {
  const f = req.body;
  const odenenTutar = Number(f.odenen_tutar) || 0;
  const genelToplam = Number(f.genel_toplam) || 0;
  let odemeDurumu;
  if (odenenTutar <= 0) odemeDurumu = 'bekliyor';
  else if (odenenTutar >= genelToplam) odemeDurumu = 'odendi';
  else odemeDurumu = 'kismi';
  db.prepare(`
    UPDATE faturalar SET
      fatura_no=?, marka=?, plaka=?, yil=?, musteri_adi=?, dosya_no=?,
      yedek_parca_net=?, iscilik_net=?, genel_toplam=?, fatura_tarihi=?,
      odeme_durumu=?, odeme_tarihi=?, odenen_tutar=?
    WHERE id=?
  `).run(
    f.fatura_no, f.marka, f.plaka || null, f.yil, f.musteri_adi, f.dosya_no,
    f.yedek_parca_net || 0, f.iscilik_net || 0, genelToplam,
    f.fatura_tarihi, odemeDurumu, f.odeme_tarihi || null,
    odenenTutar, req.params.id
  );
  const row = db.prepare('SELECT * FROM faturalar WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM faturalar WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
