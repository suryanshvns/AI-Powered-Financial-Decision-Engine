import { Router } from 'express';
import * as transactionsController from '../controllers/transactionsController.js';

const router = Router();

router.post('/', transactionsController.create);
router.get('/:userId', transactionsController.getByUserId);

export default router;
