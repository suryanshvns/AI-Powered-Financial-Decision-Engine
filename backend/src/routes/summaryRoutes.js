import { Router } from 'express';
import * as summaryController from '../controllers/summaryController.js';

const router = Router();

router.get('/:userId', summaryController.getByUserId);

export default router;
