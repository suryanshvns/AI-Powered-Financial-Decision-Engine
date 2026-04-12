import { asyncHandler } from '../utils/asyncHandler.js';
import * as assistantService from '../services/assistant.service.js';

const postAssistant = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const data = await assistantService.answerQuery(body);
  res.status(200).json({ success: true, data });
});

export { postAssistant };
