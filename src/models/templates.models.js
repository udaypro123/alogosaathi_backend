import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
      maxlength: [200, 'Template title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      maxlength: [5000, 'Template description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Education',
    },
    icon: {
      type: String,
      trim: true,
      default: '🎓',
    },
    gradient: {
      type: String,
      trim: true,
      default: 'template-purple',
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

templateSchema.index({ title: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ isActive: 1 });

const Template = mongoose.model('Template', templateSchema);

export default Template;
