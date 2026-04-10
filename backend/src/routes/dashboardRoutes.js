import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.get('/:userId', dashboardController.getByUserId);

export default router;
