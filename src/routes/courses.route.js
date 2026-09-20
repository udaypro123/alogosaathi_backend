import express from "express";
import {
  addCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addInterviewQuestions,
  uploadTopicImages,
  setTopicContentBlocks,
} from "../controllers/courses.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../utils/fileUpload.js";

const router = express.Router();

// Public / protected read routes
router.get("/", protect, authorize("admin", "users", "student"), getAllCourses);
router.get("/:id", protect, authorize("admin", "users", "student"), getCourseById);

// Admin-only mutation routes
router.post("/addCourse", protect, authorize("admin"), addCourse);
router.put("/updateCourse/:id", protect, authorize("admin"), updateCourse);
router.delete("/deleteCourse/:id", protect, authorize("admin"), deleteCourse);
router.post("/:id/addInterviewQuestions", protect, authorize("admin"), addInterviewQuestions);
router.post( "/:courseId/:chapterIndex/:topicIndex/images",protect,authorize("admin"), upload.array("images", 20),uploadTopicImages);
router.post("/:courseId/:chapterIndex/:topicIndex/content", protect, authorize("admin"), upload.array("images", 20), setTopicContentBlocks);

export default router;
