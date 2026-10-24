import logger from "../utils/logger.js";
import Course from "../models/courses.models.js";
import {
  AddCourse,
  GetAllCourses,
  GetCourseCatalog,
  GetCourseById,
  UpdateCourse,
  DeleteCourse,
  AddInterviewQuestionsToTopic,
  SetTopicContentBlocks,
} from "../dbc/courses.dbc.js";
import { uploadFile, uploadToCloudinary, deleteFile } from "../utils/fileUpload.js";

const addCourse = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const payload = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const data = await AddCourse(payload);

    res.status(200).json({
      success: true,
      message: "Course added successfully",
      data,
    });
  } catch (error) {
    logger.error("Add course request failed", { errorName: error.name });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await GetAllCourses();

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCourseCatalog = async (req, res) => {
  try {
    const courses = await GetCourseCatalog();
    res.status(200).json({
      success: true,
      message: "Course catalog fetched successfully",
      data: courses,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await GetCourseById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      updatedBy: req.user._id,
    };

    const course = await UpdateCourse(req.params.id, payload);

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await DeleteCourse(req.params.id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const addInterviewQuestions = async (req, res, next) => {
  try {
    const { chapterIndex, topicIndex, questions } = req.body;
    const courseId = req.params.id;

    const course = await AddInterviewQuestionsToTopic(
      courseId,
      chapterIndex,
      topicIndex,
      questions,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Interview questions added successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadTopicImages = async (req, res, next) => {
  try {
    const { courseId, chapterIndex, topicIndex } = req.params;
    const uploadedFiles = req.files || [];

    if (!uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const uploadedUrls = [];

    for (const file of uploadedFiles) {
      const tempPath = await uploadFile(file);
      const result = await uploadToCloudinary(tempPath, 'course-topic-images');
      await deleteFile(tempPath);
      uploadedUrls.push(result?.secure_url || result?.url || '');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const chapter = course.chapters[parseInt(chapterIndex)];

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    const topic = chapter.topics[parseInt(topicIndex)];

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    topic.images = [...(topic.images || []), ...uploadedUrls.filter(Boolean)];

    topic.updatedBy = req.user._id;
    course.updatedBy = req.user._id;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const setTopicContentBlocks = async (req, res, next) => {
  try {
    const { courseId, chapterIndex, topicIndex } = req.params;
    const uploadedFiles = req.files || [];
    const blocksRaw = req.body.blocks;

    if (!blocksRaw && !uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: "No content blocks or images provided",
      });
    }

    let blocks = [];

    if (blocksRaw) {
      try {
        blocks = JSON.parse(blocksRaw);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid blocks JSON",
        });
      }
    }

    const uploadedUrls = [];

    for (const file of uploadedFiles) {
      const tempPath = await uploadFile(file);
      const result = await uploadToCloudinary(tempPath, 'course-topic-images');
      await deleteFile(tempPath);
      uploadedUrls.push(result?.secure_url || result?.url || '');
    }

    const validBlocks = [];
    let imageIndex = 0;

    for (const block of blocks) {
      if (!block.type) {
        continue;
      }

      if (block.type === "text") {
        validBlocks.push({
          type: "text",
          content: block.content || "",
          format: block.format || "plain",
        });
      } else if (block.type === "image") {
        let imageUrl = "";

        if (block.url && block.url.trim()) {
          imageUrl = block.url.trim();
        } else if (imageIndex < uploadedUrls.length) {
          imageUrl = uploadedUrls[imageIndex];
          imageIndex += 1;
        }

        validBlocks.push({
          type: "image",
          url: imageUrl,
          alt: block.alt || "",
          caption: block.caption || "",
        });
      }
    }

    const course = await SetTopicContentBlocks(
      courseId,
      parseInt(chapterIndex),
      parseInt(topicIndex),
      validBlocks,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Topic content blocks saved successfully",
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  addCourse,
  getAllCourses,
  getCourseCatalog,
  getCourseById,
  updateCourse,
  deleteCourse,
  addInterviewQuestions,
  uploadTopicImages,
  setTopicContentBlocks,
};
