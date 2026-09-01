import express from 'express';
import {
  AddTemplate,
  getAllTemplate,
  DeleteTemplate,
  UpdateTemplate,
} from '../controllers/templates.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, uploadToCloudinary, uploadFile, deleteFile } from '../utils/fileUpload.js';

const router = express.Router();

const parseExistingImages = (bodyImages) => {
  if (!bodyImages) return [];

  if (Array.isArray(bodyImages)) return bodyImages;

  try {
    const parsed = JSON.parse(bodyImages);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return String(bodyImages)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const handleTemplateImageUpload = async (req, res, next) => {
  try {
    const uploadedFiles = req.files || [];
    if (!uploadedFiles.length) {
      return next();
    }

    const existingImages = parseExistingImages(req.body.images);
    const uploadedUrls = [];

    for (const file of uploadedFiles) {
      const tempPath = await uploadFile(file);
      const result = await uploadToCloudinary(tempPath, 'template-images');
      await deleteFile(tempPath);
      uploadedUrls.push(result?.secure_url || result?.url || '');
    }

    const mergedImages = [...new Set([...existingImages, ...uploadedUrls.filter(Boolean)])].slice(0, 3);
    req.body.images = mergedImages;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
};

router.get('/', protect, authorize('admin', 'users'), getAllTemplate);
router.post('/', protect, authorize('admin'), upload.array('images', 3), handleTemplateImageUpload, AddTemplate);
router.put('/:id', protect, authorize('admin'), upload.array('images', 3), handleTemplateImageUpload, UpdateTemplate);
router.delete('/:id', protect, authorize('admin'), DeleteTemplate);

router.get('/getalltemplates', getAllTemplate);
router.post('/addtemplate', protect, authorize('admin'), upload.array('images', 3), handleTemplateImageUpload, AddTemplate);
router.put('/updatetemplate', protect, authorize('admin'), upload.array('images', 3), handleTemplateImageUpload, UpdateTemplate);
router.delete('/deletetemplate', protect, authorize('admin'), DeleteTemplate);

export default router;
