import express from 'express';
import frotaController from '../controllers/frotaController.js';

const router = express.Router();

router.get('/', frotaController.listar.bind(frotaController));
router.get('/:id', frotaController.buscarDetalhes.bind(frotaController));
router.post('/', frotaController.registrar.bind(frotaController));
router.put('/:id', frotaController.atualizarTelemetria.bind(frotaController));
router.delete('/:id', frotaController.remover.bind(frotaController));

export default router;
