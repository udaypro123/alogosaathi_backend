import Course from "../models/courses.models.js";

// Add course
const AddCourse = async (data) => {
  try {
    const responseData = await Course.create(data);

    if (!responseData) {
      throw new Error("Course failed to add");
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

// Get all courses
const GetAllCourses = async () => {
  try {
    const responseData = await Course.find();

    if (!responseData) {
      throw new Error("Courses not found");
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

// Get single course by ID
const GetCourseById = async (id) => {
  try {
    const responseData = await Course.findById(id);

    if (!responseData) {
      throw new Error("Course not found");
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

// Update course
const UpdateCourse = async (id, updateData) => {
  try {
    const course = await Course.findById(id);

    if (!course) {
      throw new Error("Course not found");
    }

    if (updateData.courseName) course.courseName = updateData.courseName;
    if (updateData.chapters) course.chapters = updateData.chapters;
    if (updateData.updatedBy) course.updatedBy = updateData.updatedBy;

    await course.save();

    return course;
  } catch (error) {
    throw error;
  }
};

// Delete course
const DeleteCourse = async (id) => {
  try {
    const responseData = await Course.findByIdAndDelete(id);

    if (!responseData) {
      throw new Error("Course not found");
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

// Add interview questions to a specific topic
const AddInterviewQuestionsToTopic = async (courseId, chapterIndex, topicIndex, questions, updatedBy) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new Error("Course not found");
    }

    if (!course.chapters[chapterIndex]) {
      throw new Error("Chapter not found");
    }

    if (!course.chapters[chapterIndex].topics[topicIndex]) {
      throw new Error("Topic not found");
    }

    const topic = course.chapters[chapterIndex].topics[topicIndex];
    topic.interviewQuestions.push(...questions);

    if (updatedBy) {
      course.updatedBy = updatedBy;
    }

    await course.save();

    return course;
  } catch (error) {
    throw error;
  }
};

// Set topic content blocks with image upload support
const SetTopicContentBlocks = async (courseId, chapterIndex, topicIndex, blocks, updatedBy) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new Error("Course not found");
    }

    if (!course.chapters[chapterIndex]) {
      throw new Error("Chapter not found");
    }

    if (!course.chapters[chapterIndex].topics[topicIndex]) {
      throw new Error("Topic not found");
    }

    const topic = course.chapters[chapterIndex].topics[topicIndex];
    topic.contentBlocks = blocks;

    if (updatedBy) {
      course.updatedBy = updatedBy;
    }

    await course.save();

    return course;
  } catch (error) {
    throw error;
  }
};

export {
  AddCourse,
  GetAllCourses,
  GetCourseById,
  UpdateCourse,
  DeleteCourse,
  AddInterviewQuestionsToTopic,
  SetTopicContentBlocks,
};
