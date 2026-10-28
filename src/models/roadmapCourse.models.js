import mongoose from 'mongoose';

const roadmapCourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    courseNameKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

const RoadmapCourse = mongoose.model('RoadmapCourse', roadmapCourseSchema);

export default RoadmapCourse;
