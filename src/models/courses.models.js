import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Updater is required"],
      index: true,
    },
    chapters: [
      {
        title: {
          type: String,
          required: [true, "Chapter title is required"],
          trim: true,
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
        topics: [
          {
            title: {
              type: String,
              required: [true, "Topic title is required"],
              trim: true,
            },
            contentBlocks: [
              {
                type: {
                  type: String,
                  enum: ["text", "image"],
                  required: true,
                },
                content: {
                  type: String,
                  default: "",
                },
                format: {
                  type: String,
                  enum: ["plain", "markdown", "html"],
                  default: "plain",
                },
                url: {
                  type: String,
                  default: "",
                  trim: true,
                },
                alt: {
                  type: String,
                  default: "",
                  trim: true,
                },
                caption: {
                  type: String,
                  default: "",
                  trim: true,
                },
              },
            ],
            completed: {
              type: Boolean,
              default: false,
            },
            interviewQuestions: [
              {
                type: String,
                trim: true,
              },
            ],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
