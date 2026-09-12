import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../noc_bigdata.sqlite');

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log(`Conexão estabelecida com o SQLite: ${dbPath}`);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS frota (
    id TEXT PRIMARY KEY,
    modelo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    vel TEXT NOT NULL,
    latitude TEXT NOT NULL,
    longitude TEXT NOT NULL,
    ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS infraestrutura (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,
    target TEXT NOT NULL,
    latencia TEXT,
    latitude TEXT,
    longitude TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severidade TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    origem TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_frota_tipo ON frota(tipo)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_eventos_criado_em ON eventos(criado_em)`);
});

export { dbPath };
export default db;
