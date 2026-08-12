import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
dotenv.config();

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// writable temp dir (Vercel/AWS Lambda safe)
const TMP_UPLOADS_DIR = path.join(os.tmpdir(), 'uploads');

async function ensureTmpDir() {
  await fs.mkdir(TMP_UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureTmpDir();
      cb(null, TMP_UPLOADS_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file?.mimetype?.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'), false);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '', 10) || 5 * 1024 * 1024,
    files: 1
  },
  fileFilter
});

export const uploadFile = async (file) => file?.path;

export const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  if (!filePath) throw new Error('No file path provided');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const res = await cloudinary.uploader.upload(filePath, { folder });
  return res; // { secure_url, public_id, ... }
};

export const deleteFile = async (filePath) => {
  try {
    if (filePath) await fs.unlink(filePath);
  } catch {}
};

export const getFileUrl = (cloudinaryResult) => cloudinaryResult?.secure_url || null;

export const validateFileSize = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) throw new Error('No file');
  if (file.size > maxSize) throw new Error(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
  return true;
};

export const validateFileType = (
  file,
  allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) => {
  if (!file) throw new Error('No file');
  if (!allowed.includes(file.mimetype)) throw new Error(`File type ${file.mimetype} is not allowed`);
  return true;
};
