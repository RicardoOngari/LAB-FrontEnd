import frotaRepository from '../repositories/frotaRepository.js';
import db from '../config/database.js';

function registrarEvento(severidade, mensagem, origem) {
  return new Promise((resolve) => {
    db.run(
      'INSERT INTO eventos (severidade,mensagem,origem) VALUES (?,?,?)',
      [severidade, mensagem, origem],
      () => resolve()
    );
  });
}

function validarTelemetria(body) {
  if (body?.vel === undefined || body?.latitude === undefined || body?.longitude === undefined) {
    return 'vel, latitude e longitude são obrigatórios.';
  }

  const vel = Number(body.vel);
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!Number.isFinite(vel) || vel < 0 || vel > 300) return 'vel deve ser um número entre 0 e 300.';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'latitude inválida.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'longitude inválida.';
  return null;
}

class FrotaController {
  async listar(req, res) {
    try {
      const veiculos = await frotaRepository.listarTodos(500);
      res.status(200).json(veiculos);
    } catch (error) {
      console.error('GET /api/frota:', error);
      res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
  }

  async buscarDetalhes(req, res) {
    try {
      const veiculo = await frotaRepository.buscarPorId(req.params.id);
      if (!veiculo) return res.status(404).json({ mensagem: 'Veículo não encontrado.' });
      res.status(200).json(veiculo);
    } catch (error) {
      console.error('GET /api/frota/:id:', error);
      res.status(500).json({ erro: 'Falha na busca.' });
    }
  }

  async registrar(req, res) {
    try {
      const { id, tipo, modelo = '🚛', vel = '0', latitude = '0', longitude = '0' } = req.body || {};
      if (!id || !tipo) return res.status(400).json({ erro: 'ID e Tipo são obrigatórios.' });
      const erroTelemetria = validarTelemetria({ vel, latitude, longitude });
      if (erroTelemetria) return res.status(400).json({ erro: erroTelemetria });

      const novoVeiculo = await frotaRepository.criar({ id, modelo, tipo, vel: String(vel), latitude: String(latitude), longitude: String(longitude) });
      await registrarEvento('info', `Veículo ${id} criado no CRUD.`, 'CRUD');
      res.status(201).json(novoVeiculo);
    } catch (error) {
      console.error('POST /api/frota:', error);
      const status = /UNIQUE|constraint/i.test(error.message) ? 409 : 500;
      res.status(status).json({ erro: status === 409 ? 'ID já cadastrado.' : 'Erro ao inserir veículo.' });
    }
  }

  async atualizarTelemetria(req, res) {
    try {
      const erroValidacao = validarTelemetria(req.body);
      if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

      const linhasAfetadas = await frotaRepository.atualizar(req.params.id, {
        vel: String(req.body.vel),
        latitude: String(req.body.latitude),
        longitude: String(req.body.longitude)
      });

      if (linhasAfetadas === 0) return res.status(404).json({ mensagem: 'Veículo inexistente.' });
      await registrarEvento('info', `Telemetria ${req.params.id} atualizada: ${req.body.latitude}, ${req.body.longitude} · ${req.body.vel} km/h`, 'TELEMETRIA');
      res.status(200).json({ mensagem: 'Telemetria atualizada.', linhasAfetadas });
    } catch (error) {
      console.error('PUT /api/frota/:id:', error);
      res.status(500).json({ erro: 'Erro no Update SQL.' });
    }
  }

  async remover(req, res) {
    try {
      const linhasAfetadas = await frotaRepository.deletar(req.params.id);
      if (linhasAfetadas === 0) return res.status(404).json({ mensagem: 'Veículo inexistente.' });
      await registrarEvento('warning', `Veículo ${req.params.id} removido pelo CRUD.`, 'CRUD');
      res.status(204).send();
    } catch (error) {
      console.error('DELETE /api/frota/:id:', error);
      res.status(500).json({ erro: 'Falha ao deletar.' });
    }
  }
}

export default new FrotaController();
