// routes/auth.routes.js

import express from 'express';
import {
  addClient,
  getallClient,
  deleteClient,
  updateClient
} from '../controllers/ourClient.controller.js';

import { protect, authRateLimit, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/addClient', protect, authorize("admin"), addClient);
router.get('/getallClient', protect, authorize("admin", "users"), getallClient);
router.delete('/deleteClient', protect, authorize("admin"), deleteClient);
router.put('/updateClient', protect, authorize("admin"), updateClient);



export default router;
