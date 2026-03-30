const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'faturalar.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS faturalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_no TEXT,
    marka TEXT,
    plaka TEXT,
    yil INTEGER,
    musteri_adi TEXT,
    dosya_no TEXT,
    yedek_parca_net REAL DEFAULT 0,
    iscilik_net REAL DEFAULT 0,
    genel_toplam REAL DEFAULT 0,
    fatura_tarihi TEXT,
    odeme_durumu TEXT DEFAULT 'bekliyor',
    odeme_tarihi TEXT,
    odeme_yontemi TEXT,
    odenen_tutar REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

try { db.exec("ALTER TABLE faturalar ADD COLUMN plaka TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE faturalar DROP COLUMN model"); } catch(e) {}
try { db.exec("ALTER TABLE faturalar ADD COLUMN sigorta_sirketi TEXT"); } catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS fatura_havuzu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_no TEXT,
    marka TEXT,
    plaka TEXT,
    yil INTEGER,
    musteri_adi TEXT,
    dosya_no TEXT,
    sigorta_sirketi TEXT,
    yedek_parca_net REAL DEFAULT 0,
    iscilik_net REAL DEFAULT 0,
    genel_toplam REAL DEFAULT 0,
    fatura_tarihi TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);
try { db.exec("ALTER TABLE fatura_havuzu ADD COLUMN sigorta_sirketi TEXT"); } catch(e) {}

// ── Ekspertiz tabloları ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS ekspertiz_dosyalari (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    rapor_no       TEXT,
    plaka          TEXT,
    marka_model    TEXT,
    yil            INTEGER,
    renk           TEXT,
    sasi_no        TEXT,
    motor_no       TEXT,
    km             TEXT,
    yakit_turu     TEXT,
    musteri_adi    TEXT,
    musteri_tel    TEXT,
    sigorta_sirketi TEXT,
    police_no      TEXT,
    hasar_tarihi   TEXT,
    ihbar_tarihi   TEXT,
    durum          TEXT DEFAULT 'taslak',
    eksper_adi     TEXT,
    eksper_notu    TEXT,
    eksper_tarih   TEXT,
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ekspertiz_parcalar (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    dosya_id     INTEGER NOT NULL,
    parca_adi    TEXT,
    hasar_durumu TEXT,
    parca_no     TEXT,
    fiyat        REAL DEFAULT 0,
    kaynak       TEXT DEFAULT 'ekspertiz',
    FOREIGN KEY (dosya_id) REFERENCES ekspertiz_dosyalari(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ekspertiz_iscilikleri (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    dosya_id     INTEGER NOT NULL,
    parca_adi    TEXT,
    iscilik_tipi TEXT,
    tutar        REAL DEFAULT 0,
    kaynak       TEXT DEFAULT 'ekspertiz',
    FOREIGN KEY (dosya_id) REFERENCES ekspertiz_dosyalari(id) ON DELETE CASCADE
  )
`);

// Migration: eski kalem_adi -> parca_adi + iscilik_tipi
try { db.exec("ALTER TABLE ekspertiz_iscilikleri ADD COLUMN parca_adi TEXT") } catch(e) {}
try { db.exec("ALTER TABLE ekspertiz_iscilikleri ADD COLUMN iscilik_tipi TEXT") } catch(e) {}
try {
  const cols = db.prepare("PRAGMA table_info(ekspertiz_iscilikleri)").all().map(c => c.name);
  if (cols.includes('kalem_adi')) {
    db.exec("UPDATE ekspertiz_iscilikleri SET parca_adi=kalem_adi WHERE parca_adi IS NULL");
  }
} catch(e) {}

module.exports = db;
