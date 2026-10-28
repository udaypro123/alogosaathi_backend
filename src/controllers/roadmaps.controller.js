import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import Course from '../models/courses.models.js';
import RoadmapDocument from '../models/roadmapDocument.models.js';
import {
  deleteCloudinaryRawAsset,
  uploadDocumentToCloudinary
} from '../utils/fileUpload.js';
import logger from '../utils/logger.js';

const getRoadmaps = async (req, res) => {
  try {
    const [courses, documents] = await Promise.all([
      Course.find().select('_id courseName').sort({ courseName: 1 }).lean(),
      RoadmapDocument.find()
        .populate('course', 'courseName')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const documentsByCourse = new Map();
    for (const document of documents) {
      const courseName = document.courseName || document.course?.courseName;
      if (!courseName) continue;
      const courseKey = courseName.trim().toLocaleLowerCase();
      const courseDocuments = documentsByCourse.get(courseKey) || [];
      courseDocuments.push({
        id: document._id,
        courseName,
        title: document.title,
        description: document.description,
        fileName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.createdAt
      });
      documentsByCourse.set(courseKey, courseDocuments);
    }

    const roadmapCourses = new Map(
      courses.map((course) => [
        course.courseName.trim().toLocaleLowerCase(),
        {
          id: course._id,
          courseName: course.courseName,
          documents: documentsByCourse.get(course.courseName.trim().toLocaleLowerCase()) || []
        }
      ])
    );
    for (const [courseKey, courseDocuments] of documentsByCourse) {
      if (!roadmapCourses.has(courseKey)) {
        roadmapCourses.set(courseKey, {
          id: `roadmap-${courseKey}`,
          courseName: courseDocuments[0].courseName || courseKey,
          documents: courseDocuments
        });
      }
    }

    res.status(200).json({
      success: true,
      data: [...roadmapCourses.values()].sort((first, second) =>
        first.courseName.localeCompare(second.courseName)
      )
    });
  } catch (error) {
    logger.error('Roadmap listing failed', { errorName: error.name });
    res.status(500).json({
      success: false,
      message: 'Unable to load roadmaps.'
    });
  }
};

const uploadRoadmapDocument = async (req, res) => {
  let uploadedAsset;
  try {
    const { courseName, title, description = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Choose a roadmap document to upload.'
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Document title is required.'
      });
    }

    if (!courseName?.trim() || courseName.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Enter a course name between 1 and 120 characters.'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters.'
      });
    }

    const normalizedCourseName = courseName.trim().replace(/\s+/g, ' ');
    const escapedCourseName = normalizedCourseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const course = await Course.findOne({
      courseName: { $regex: `^${escapedCourseName}$`, $options: 'i' }
    }).select('_id courseName');

    uploadedAsset = await uploadDocumentToCloudinary(
      req.file,
      `algosaathi/roadmaps/${course?._id || encodeURIComponent(normalizedCourseName)}`
    );

    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      '.odp': 'application/vnd.oasis.opendocument.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.csv': 'text/csv',
      '.md': 'text/markdown',
      '.epub': 'application/epub+zip',
      '.zip': 'application/zip'
    };
    const extension = req.file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    const document = await RoadmapDocument.create({
      ...(course ? { course: course._id } : {}),
      courseName: course?.courseName || normalizedCourseName,
      title: title.trim(),
      description: description.trim(),
      originalName: req.file.originalname,
      mimeType: mimeTypes[extension] || 'application/octet-stream',
      fileSize: req.file.size,
      fileUrl: uploadedAsset.secure_url,
      publicId: uploadedAsset.public_id,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Roadmap document uploaded.',
      data: {
        id: document._id,
        title: document.title,
        fileName: document.originalName
      }
    });
  } catch (error) {
    if (uploadedAsset?.public_id) {
      try {
        await deleteCloudinaryRawAsset(uploadedAsset.public_id);
      } catch (cleanupError) {
        logger.error('Unable to remove orphaned roadmap document from cloud storage', {
          errorName: cleanupError.name
        });
      }
    }

    logger.error('Roadmap document upload failed', { errorName: error.name });
    res.status(500).json({
      success: false,
      message: 'Roadmap document upload failed.'
    });
  }
};

const downloadRoadmapDocument = async (req, res) => {
  try {
    const document = await RoadmapDocument.findById(req.params.documentId).lean();
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap document not found.'
      });
    }

    const fileUrl = new URL(document.fileUrl);
    if (fileUrl.protocol !== 'https:' || fileUrl.hostname !== 'res.cloudinary.com') {
      throw new Error('Stored roadmap file URL is not trusted.');
    }

    const upstream = await fetch(fileUrl);
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({
        success: false,
        message: 'Roadmap document download is temporarily unavailable.'
      });
    }

    const safeFileName = encodeURIComponent(document.originalName);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.fileSize);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${safeFileName}`
    );
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    logger.error('Roadmap document download failed', { errorName: error.name });
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Roadmap document download failed.'
      });
    } else {
      res.destroy();
    }
  }
};

const deleteRoadmapDocument = async (req, res) => {
  try {
    const document = await RoadmapDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap document not found.'
      });
    }

    const result = await deleteCloudinaryRawAsset(document.publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error('Cloud storage did not confirm document deletion.');
    }

    await document.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Roadmap document deleted.'
    });
  } catch (error) {
    logger.error('Roadmap document deletion failed', { errorName: error.name });
    res.status(500).json({
      success: false,
      message: 'Roadmap document deletion failed.'
    });
  }
};

export {
  getRoadmaps,
  uploadRoadmapDocument,
  downloadRoadmapDocument,
  deleteRoadmapDocument
};
