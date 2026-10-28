import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import RoadmapCourse from '../models/roadmapCourse.models.js';
import RoadmapDocument from '../models/roadmapDocument.models.js';
import {
  deleteCloudinaryRawAsset,
  getCloudinaryRawDownloadUrls,
  uploadDocumentToCloudinary
} from '../utils/fileUpload.js';
import logger from '../utils/logger.js';

const getRoadmaps = async (req, res) => {
  try {
    const [roadmapCourses, documents] = await Promise.all([
      RoadmapCourse.find().sort({ courseName: 1 }).lean(),
      RoadmapDocument.find()
        .populate('roadmapCourse', 'courseName')
        .populate('course', 'courseName')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const documentsByCourse = new Map();
    for (const document of documents) {
      const courseName = document.roadmapCourse?.courseName ||
        document.courseName ||
        document.course?.courseName;
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

    const roadmapCoursesByName = new Map(
      roadmapCourses.map((course) => {
        const courseKey = course.courseName.trim().toLocaleLowerCase();
        return [courseKey, {
          id: course._id,
          courseName: course.courseName,
          managed: true,
          documents: documentsByCourse.get(courseKey) || []
        }];
      })
    );
    for (const [courseKey, courseDocuments] of documentsByCourse) {
      if (roadmapCoursesByName.has(courseKey)) continue;
      const courseName = courseDocuments[0].courseName || courseKey;
      roadmapCoursesByName.set(courseKey, {
        id: `roadmap-${courseKey}`,
        courseName,
        managed: false,
        documents: courseDocuments
      });
    }

    res.status(200).json({
      success: true,
      data: [...roadmapCoursesByName.values()].map((course) => ({
        ...course,
        documents: course.documents || []
      })).sort((first, second) =>
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

const normalizeCourseName = (value) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
);

const resolveRoadmapCourse = async (courseName, userId) => {
  const normalizedName = normalizeCourseName(courseName);
  const courseNameKey = normalizedName.toLocaleLowerCase();
  let roadmapCourse = await RoadmapCourse.findOne({ courseNameKey });
  if (roadmapCourse) return roadmapCourse;

  try {
    roadmapCourse = await RoadmapCourse.create({
      courseName: normalizedName,
      courseNameKey,
      createdBy: userId,
      updatedBy: userId
    });
    return roadmapCourse;
  } catch (error) {
    if (error.code !== 11000) throw error;
    roadmapCourse = await RoadmapCourse.findOne({ courseNameKey });
    if (!roadmapCourse) throw error;
    return roadmapCourse;
  }
};

const createRoadmapCourse = async (req, res) => {
  const courseName = normalizeCourseName(req.body.courseName);
  if (!courseName || courseName.length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Enter a course name between 1 and 120 characters.'
    });
  }

  try {
    const courseNameKey = courseName.toLocaleLowerCase();
    const course = await RoadmapCourse.create({
      courseName,
      courseNameKey,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    return res.status(201).json({
      success: true,
      message: 'Roadmap course created.',
      data: { id: course._id, courseName: course.courseName }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A roadmap course with this name already exists.'
      });
    }
    logger.error('Roadmap course creation failed', { errorName: error.name });
    return res.status(500).json({
      success: false,
      message: 'Unable to create the roadmap course.'
    });
  }
};

const updateRoadmapCourse = async (req, res) => {
  const courseName = normalizeCourseName(req.body.courseName);
  if (!courseName || courseName.length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Enter a course name between 1 and 120 characters.'
    });
  }

  try {
    const course = await RoadmapCourse.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap course not found.'
      });
    }

    const previousName = course.courseName;
    course.courseName = courseName;
    course.courseNameKey = courseName.toLocaleLowerCase();
    course.updatedBy = req.user._id;
    await course.save();

    const escapedPreviousName = previousName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await RoadmapDocument.updateMany(
      {
        $or: [
          { roadmapCourse: course._id },
          {
            roadmapCourse: { $exists: false },
            courseName: { $regex: `^${escapedPreviousName}$`, $options: 'i' }
          }
        ]
      },
      { $set: { courseName, roadmapCourse: course._id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Roadmap course updated.',
      data: { id: course._id, courseName: course.courseName }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A roadmap course with this name already exists.'
      });
    }
    logger.error('Roadmap course update failed', { errorName: error.name });
    return res.status(500).json({
      success: false,
      message: 'Unable to update the roadmap course.'
    });
  }
};

const deleteRoadmapCourse = async (req, res) => {
  try {
    const course = await RoadmapCourse.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap course not found.'
      });
    }

    const escapedName = course.courseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const documentsExist = await RoadmapDocument.exists({
      $or: [
        { roadmapCourse: course._id },
        {
          roadmapCourse: { $exists: false },
          courseName: { $regex: `^${escapedName}$`, $options: 'i' }
        }
      ]
    });
    if (documentsExist) {
      return res.status(409).json({
        success: false,
        message: 'Delete this course’s roadmap documents before deleting the course.'
      });
    }

    await course.deleteOne();
    return res.status(200).json({
      success: true,
      message: 'Roadmap course deleted.'
    });
  } catch (error) {
    logger.error('Roadmap course deletion failed', { errorName: error.name });
    return res.status(500).json({
      success: false,
      message: 'Unable to delete the roadmap course.'
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

    const normalizedCourseName = normalizeCourseName(courseName);
    const roadmapCourse = await resolveRoadmapCourse(normalizedCourseName, req.user._id);

    uploadedAsset = await uploadDocumentToCloudinary(
      req.file,
      `algosaathi/roadmaps/${roadmapCourse._id}`
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
      roadmapCourse: roadmapCourse._id,
      courseName: roadmapCourse.courseName,
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

const updateRoadmapDocument = async (req, res) => {
  let uploadedAsset;
  try {
    const document = await RoadmapDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap document not found.'
      });
    }

    const { courseName, title, description } = req.body;
    if (typeof courseName !== 'string' || !courseName.trim() || courseName.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Enter a course name between 1 and 120 characters.'
      });
    }
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Document title is required and must be 120 characters or fewer.'
      });
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters.'
      });
    }

    const normalizedCourseName = normalizeCourseName(courseName);
    const roadmapCourse = await resolveRoadmapCourse(normalizedCourseName, req.user._id);
    if (req.file) {
      uploadedAsset = await uploadDocumentToCloudinary(
        req.file,
        `algosaathi/roadmaps/${roadmapCourse._id}`
      );
    }

    const oldPublicId = document.publicId;
    document.roadmapCourse = roadmapCourse._id;
    document.course = undefined;
    document.courseName = roadmapCourse.courseName;
    document.title = title.trim();
    document.description = description?.trim() || '';

    if (req.file && uploadedAsset) {
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
      document.originalName = req.file.originalname;
      document.mimeType = mimeTypes[extension] || 'application/octet-stream';
      document.fileSize = req.file.size;
      document.fileUrl = uploadedAsset.secure_url;
      document.publicId = uploadedAsset.public_id;
    }

    await document.save();
    uploadedAsset = null;

    if (req.file) {
      try {
        await deleteCloudinaryRawAsset(oldPublicId);
      } catch (cleanupError) {
        logger.error('Unable to remove replaced roadmap document from cloud storage', {
          errorName: cleanupError.name
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Roadmap document updated.',
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
        logger.error('Unable to remove orphaned replacement roadmap document', {
          errorName: cleanupError.name
        });
      }
    }
    logger.error('Roadmap document update failed', { errorName: error.name });
    return res.status(500).json({
      success: false,
      message: 'Roadmap document update failed.'
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

    const downloadUrls = [
      fileUrl,
      ...getCloudinaryRawDownloadUrls(document.publicId, document.originalName).map((url) => new URL(url))
    ];
    let upstream;
    const upstreamStatuses = [];

    for (const downloadUrl of downloadUrls) {
      if (
        downloadUrl.protocol !== 'https:' ||
        !['res.cloudinary.com', 'api.cloudinary.com'].includes(downloadUrl.hostname)
      ) {
        throw new Error('Generated roadmap download URL is not trusted.');
      }

      try {
        const response = await fetch(downloadUrl);
        if (response.ok && response.body) {
          upstream = response;
          break;
        }
        upstreamStatuses.push(response.status);
        await response.body?.cancel();
      } catch (error) {
        upstreamStatuses.push(error.name || 'FetchError');
      }
    }

    if (!upstream) {
      logger.error('Cloudinary roadmap download sources were unavailable', {
        statuses: upstreamStatuses
      });
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
    return res.status(200).json({
      success: true,
      message: 'Roadmap document deleted.'
    });
  } catch (error) {
    logger.error('Roadmap document deletion failed', { errorName: error.name });
    return res.status(500).json({
      success: false,
      message: 'Roadmap document deletion failed.'
    });
  }
};

export {
  getRoadmaps,
  createRoadmapCourse,
  updateRoadmapCourse,
  deleteRoadmapCourse,
  uploadRoadmapDocument,
  updateRoadmapDocument,
  deleteRoadmapDocument,
  downloadRoadmapDocument
};
