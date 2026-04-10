import { Router } from 'express';
import * as rulesController from '../controllers/rulesController.js';

const router = Router();

router.get('/:userId', rulesController.getByUserId);
router.put('/:userId', rulesController.putByUserId);

export default router;
