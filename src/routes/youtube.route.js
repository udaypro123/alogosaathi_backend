// routes/auth.routes.js

import express from 'express';
import {
  AddYoutubeItem,
  UpdateYoutubeItem,
  getALLYoutubePost,
  DeleteYoutubePost
} from '../controllers/youtube.controller.js';

import { protect, authRateLimit, authorize } from '../middleware/auth.js';
import {
 
// write here your validation logic
} from '../middleware/validation.js';

const router = express.Router();

// Protected routes
router.post('/addyoutubepost', protect, authorize("admin"), AddYoutubeItem);
router.get('/getallyoutubeport', protect, authorize("admin", "users", "student"), getALLYoutubePost);
router.delete('/deleteyoutubeport', protect, authorize("admin"), DeleteYoutubePost);
router.put('/updateyoutubepost', protect, authorize("admin"), UpdateYoutubeItem);



export default router;
