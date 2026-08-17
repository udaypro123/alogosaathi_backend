import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const youtubePostSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [150, 'First name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    minLength: [30, 'please Enter min 30 characters']
  },

  link:{
    type: String,
    required:true,
    default:""
  },
  playListName:{
    type: String,
    required:true,
    default:""
  },
  role: {
    type: String,
    enum: ['users', 'admin'],
    default: 'admin'
  },

  thumbnail: {
    type: String,
    // required:true,
    default: ''
  },
  profileImagePublicId: {
    type: String,
    default: null
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

youtubePostSchema.index({ title: 1 });
youtubePostSchema.index({ playListName: 1 });

const YouTubePost = mongoose.model('YouTubePost', youtubePostSchema);
export default YouTubePost;
