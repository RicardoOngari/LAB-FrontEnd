import db from '../config/database.js';

class FrotaRepository {
  listarTodos(limite = 500) {
    const limiteSeguro = Math.min(Math.max(Number(limite) || 500, 1), 500);
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM frota ORDER BY RANDOM() LIMIT ?',
        [limiteSeguro],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  contar() {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS total FROM frota', [], (err, row) => (err ? reject(err) : resolve(row.total)));
    });
  }

  contarPorCategoria() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT tipo, COUNT(*) AS total FROM frota GROUP BY tipo ORDER BY tipo',
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  buscarPorId(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM frota WHERE id = ?', [id], (err, row) => (err ? reject(err) : resolve(row)));
    });
  }

  criar(veiculo) {
    return new Promise((resolve, reject) => {
      const { id, modelo, tipo, vel, latitude, longitude } = veiculo;
      const query = `INSERT INTO frota (id, modelo, tipo, vel, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(query, [id, modelo, tipo, vel, latitude, longitude], function callback(err) {
        if (err) return reject(err);
        resolve({ id, modelo, tipo, vel, latitude, longitude });
      });
    });
  }

  atualizar(id, dados) {
    return new Promise((resolve, reject) => {
      const { vel, latitude, longitude } = dados;
      db.run(
        `UPDATE frota SET vel = ?, latitude = ?, longitude = ?, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`,
        [vel, latitude, longitude, id],
        function callback(err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  deletar(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM frota WHERE id = ?', [id], function callback(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }
}

export default new FrotaRepository();
