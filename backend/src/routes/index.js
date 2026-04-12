import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import summaryRoutes from './summaryRoutes.js';
import rulesRoutes from './rulesRoutes.js';
import predictRoutes from './predictRoutes.js';
import simulationRoutes from './simulationRoutes.js';
import transactionsRoutes from './transactionsRoutes.js';
import assistantRoutes from './assistantRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/summary', summaryRoutes);
router.use('/rules', rulesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/predict', predictRoutes);
router.use('/simulate', simulationRoutes);
router.use('/assistant', assistantRoutes);

export default router;
