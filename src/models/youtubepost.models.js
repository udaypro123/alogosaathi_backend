import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const youtubepostSchema = new mongoose.Schema({
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
    maxLength: [400, 'Last name cannot exceed 50 characters']
  },

  link:{
    type: String,
    required:true,
    default:""
  },
  role: {
    type: String,
    enum: ['users', 'admin'],
    default: 'Admin'
  },

  profilePicture: {
    type: String,
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



const YouTubePost = mongoose.model('YouTubePost', youtubepostSchema);
export default YouTubePost;
