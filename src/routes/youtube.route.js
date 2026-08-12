// routes/auth.routes.js

import express from 'express';
import {
  AddYoutubeItem,
  UpdateYoutubeItem
} from '../controllers/youtube.controller.js';

import { protect, authRateLimit, authorize } from '../middleware/auth.js';
import {
 
// write here your validation logic
} from '../middleware/validation.js';

const router = express.Router();

// Protected routes
router.post('/addyoutubepost', protect, authorize("admin"), AddYoutubeItem);
router.put('/updateyoutubepost', protect, authorize("admin"), UpdateYoutubeItem);


export default router;
