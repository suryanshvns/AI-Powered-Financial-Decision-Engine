import { Router } from 'express';
import * as assistantController from '../controllers/assistantController.js';

const router = Router();

router.post('/', assistantController.postAssistant);

export default router;
