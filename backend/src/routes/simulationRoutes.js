import { Router } from 'express';
import * as simulationController from '../controllers/simulationController.js';

const router = Router();

router.post('/', simulationController.simulate);

export default router;
