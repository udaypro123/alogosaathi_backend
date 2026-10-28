import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { roadmapDocumentUpload } from '../utils/fileUpload.js';
import {
  getRoadmaps,
  uploadRoadmapDocument,
  downloadRoadmapDocument,
  deleteRoadmapDocument
} from '../controllers/roadmaps.controller.js';

const router = express.Router();

const parseRoadmapDocument = (req, res, next) => {
  roadmapDocumentUpload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        message: error.message
      });
    }

    next();
  });
};

router.get('/', protect, authorize('admin', 'users', 'student'), getRoadmaps);
router.get('/:documentId/download', protect, authorize('admin', 'users', 'student'), downloadRoadmapDocument);
router.post('/documents', protect, authorize('admin'), parseRoadmapDocument, uploadRoadmapDocument);
router.delete('/:documentId', protect, authorize('admin'), deleteRoadmapDocument);

export default router;
