import mongoose from 'mongoose';

const roadmapDocumentSchema = new mongoose.Schema({
  roadmapCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoadmapCourse',
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

roadmapDocumentSchema.index({ courseName: 1, createdAt: -1 });

const RoadmapDocument = mongoose.model('RoadmapDocument', roadmapDocumentSchema);

export default RoadmapDocument;
