import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../noc_bigdata.sqlite');

const sqlite = sqlite3.verbose();
const categorias = [
  { tipo: 'Ônibus', modelo: '🚌' },
  { tipo: 'Caminhão', modelo: '🚚' },
  { tipo: 'Moto', modelo: '🏍️' },
  { tipo: 'Carro', modelo: '🚗' },
  { tipo: 'Caminhonete', modelo: '🛻' },
  { tipo: 'Van', modelo: '🚐' },
  { tipo: 'SUV', modelo: '🚙' },
  { tipo: 'Esportivo', modelo: '🏎️' },
  { tipo: 'Trator', modelo: '🚜' },
  { tipo: 'Ambulância', modelo: '🚑' }
];

const infraDados = [
  [0, 'Base NOC', 'SENAI SP Vila Leopoldina', '0ms', '-23.5315', '-46.7358'],
  [1, 'Link VSAT (Hub Principal)', 'Satélite Star One D2', '580ms', null, null],
  [2, 'Link VSAT (BGAN Backup)', 'Satélite Inmarsat', '850ms', null, null],
  [3, 'Roteamento OSPF', 'Core Interno (10.0.0.1)', '2ms', null, null],
  [4, 'Sessão BGP', 'Operadora AS-1042', '12ms', null, null],
  [5, 'Link LTE-Móvel', 'Antena Celular ERB', '45ms', null, null]
];

function gerarCoordenada(base, variancia) {
  return (base + (Math.random() * variancia - variancia / 2)).toFixed(4);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function prepare(db, sql) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql, (err) => {
      if (err) reject(err);
      else resolve(stmt);
    });
  });
}

function stmtRun(stmt, params = []) {
  return new Promise((resolve, reject) => {
    stmt.run(params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function finalize(stmt) {
  return new Promise((resolve, reject) => {
    stmt.finalize((err) => (err ? reject(err) : resolve()));
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new sqlite.Database(dbPath);

  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  const close = () => new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });

  try {
    console.log('Iniciando preparação do banco Big Data...');

    await run(`CREATE TABLE frota (
      id TEXT PRIMARY KEY,
      modelo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      vel TEXT NOT NULL,
      latitude TEXT NOT NULL,
      longitude TEXT NOT NULL,
      ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await run(`CREATE TABLE infraestrutura (
      id INTEGER PRIMARY KEY,
      tipo TEXT NOT NULL,
      target TEXT NOT NULL,
      latencia TEXT,
      latitude TEXT,
      longitude TEXT
    )`);
    await run(`CREATE TABLE eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      severidade TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      origem TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await run('CREATE INDEX idx_frota_tipo ON frota(tipo)');
    await run('CREATE INDEX idx_eventos_criado_em ON eventos(criado_em)');

    const infra = db.prepare('INSERT INTO infraestrutura (id,tipo,target,latencia,latitude,longitude) VALUES (?,?,?,?,?,?)');
    infraDados.forEach((row) => infra.run(row));
    await new Promise((resolve, reject) => infra.finalize((err) => err ? reject(err) : resolve()));

    await run('BEGIN TRANSACTION');
    const frota = db.prepare('INSERT INTO frota (id,modelo,tipo,vel,latitude,longitude) VALUES (?,?,?,?,?,?)');
    let count = 1;

    for (const categoria of categorias) {
      for (let i = 0; i < 10000; i += 1) {
        const id = `V-${String(count).padStart(6, '0')}`;
        const vel = String(Math.floor(Math.random() * 120));
        const lat = gerarCoordenada(-14.23, 30);
        const lng = gerarCoordenada(-51.92, 30);
        frota.run([id, categoria.modelo, categoria.tipo, vel, lat, lng]);
        count += 1;
      }
    }

    await new Promise((resolve, reject) => frota.finalize((err) => err ? reject(err) : resolve()));
    await run('COMMIT');

    const eventos = db.prepare('INSERT INTO eventos (severidade,mensagem,origem) VALUES (?,?,?)');
    eventos.run(['info', 'Carga Big Data concluída: 100.000 veículos inseridos via transação SQLite.', 'SEED']);
    eventos.run(['info', 'NOC pronto para monitoramento.', 'SYSTEM']);
    await new Promise((resolve, reject) => eventos.finalize((err) => err ? reject(err) : resolve()));

    console.log(`Sucesso! ${count - 1} veículos foram inseridos no banco.`);
    console.log(`Banco gerado em: ${dbPath}`);
  } catch (error) {
    console.error('Falha no seed:', error.message);
    try { await run('ROLLBACK'); } catch (_) {}
    process.exitCode = 1;
  } finally {
    await close();
  }
}

main();
