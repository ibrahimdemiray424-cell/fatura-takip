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

db.exec(`
  CREATE TABLE IF NOT EXISTS fatura_havuzu (
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
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;
