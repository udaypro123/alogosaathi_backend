
import express from 'express';
import {
    getAllUsersQuery,
  usersQuery,
} from '../controllers/user.controller.js';
import { authorize, protect } from '../middleware/auth.js';


const router = express.Router();
router.post('/sendquery', usersQuery)
router.get('/getquery', protect, authorize('admin'), getAllUsersQuery)


export default router;
