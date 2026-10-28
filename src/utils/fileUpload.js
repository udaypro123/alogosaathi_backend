import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Readable } from 'stream';
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

const roadmapDocumentExtensions = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.odt', '.ods', '.odp', '.txt', '.rtf', '.csv', '.md',
  '.epub', '.zip'
]);

const roadmapDocumentStorage = multer.memoryStorage();

const roadmapDocumentFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (roadmapDocumentExtensions.has(extension)) return cb(null, true);
  cb(new Error('Unsupported roadmap document format.'), false);
};

export const roadmapDocumentUpload = multer({
  storage: roadmapDocumentStorage,
  limits: {
    fileSize: parseInt(process.env.ROADMAP_MAX_FILE_SIZE || '', 10) || 25 * 1024 * 1024,
    files: 1
  },
  fileFilter: roadmapDocumentFileFilter
});

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '', 10) || 5 * 1024 * 1024,
    files: 3
  },
  fileFilter
});

export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '', 10) || 5 * 1024 * 1024,
    files: 3
  },
  fileFilter
});

export const uploadFile = async (file) => file?.path;

export const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  if (!filePath) throw new Error('No file path provided');

  configureCloudinary();

  const res = await cloudinary.uploader.upload(filePath, { folder });
  return res; // { secure_url, public_id, ... }
};

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

export const uploadDocumentToCloudinary = (file, folder) => {
  if (!file?.buffer) throw new Error('No document data provided');
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        use_filename: true,
        unique_filename: true,
        filename_override: path.basename(file.originalname)
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloud storage returned no upload result'));
        resolve(result);
      }
    );

    Readable.from([file.buffer]).pipe(uploadStream);
  });
};

export const deleteCloudinaryRawAsset = async (publicId) => {
  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
};

export const getCloudinaryRawDownloadUrls = (publicId, originalName) => {
  configureCloudinary();
  const extension = path.extname(originalName).slice(1);
  const publicIdExtension = path.extname(publicId).slice(1);
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const urls = [
    cloudinary.utils.private_download_url(publicId, '', {
      resource_type: 'raw',
      type: 'upload',
      attachment: true,
      expires_at: expiresAt
    })
  ];

  if (extension && publicIdExtension.toLowerCase() === extension.toLowerCase()) {
    const publicIdWithoutExtension = publicId.slice(0, -(publicIdExtension.length + 1));
    urls.push(cloudinary.utils.private_download_url(publicIdWithoutExtension, extension, {
      resource_type: 'raw',
      type: 'upload',
      attachment: true,
      expires_at: expiresAt
    }));
  }

  return urls;
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
