import express from 'express';
import {
  getNews,
  addNews,
  deleteNews,
  updateNews,
} from '../controllers/news.controller.js';
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

router.post('/addNews', protect, authorize('admin'),  upload.array('images', 3), handleTemplateImageUpload, addNews);
router.get('/getNews', getNews);
router.put('/updateNews', protect, authorize('admin'), upload.array('images', 3), handleTemplateImageUpload, updateNews);
router.delete('/deleteNews', protect, authorize('admin'), deleteNews);

export default router;
