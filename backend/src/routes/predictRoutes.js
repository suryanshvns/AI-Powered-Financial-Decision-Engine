import { Router } from 'express';
import * as predictController from '../controllers/predictController.js';

const router = Router();

router.get('/:userId', predictController.getByUserId);

export default router;
