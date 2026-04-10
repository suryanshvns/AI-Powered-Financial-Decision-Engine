import { asyncHandler } from '../utils/asyncHandler.js';
import * as simulationService from '../services/simulationService.js';

const simulate = asyncHandler(async (req, res) => {
  const data = await simulationService.runSimulation(req.body);
  res.status(200).json({ success: true, data });
});

export { simulate };
