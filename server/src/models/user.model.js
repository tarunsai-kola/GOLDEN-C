const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: 'Not saying',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      default: '',
      maxlength: [90, 'Headline cannot exceed 90 characters'],
    },
    intro: {
      type: String,
      trim: true,
      default: '',
      maxlength: [600, 'Intro cannot exceed 600 characters'],
    },
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    workCovers: {
      type: [String],
      default: [],
    },
    fields: {
      type: [String],
      default: [],
    },
    timeCommitment: {
      type: String,
      enum: ['Full time', 'Part time', 'Exploring', ''],
      default: '',
    },
    lookingFor: {
      type: String,
      enum: ['A co-founder for my idea', 'An idea to join', 'Either', ''],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    isDeactivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    accountType: {
      type: String,
      enum: ['individual', 'startup', 'investor', 'mentor'],
      default: 'individual',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    adminRole: {
      type: String,
      enum: ['super_admin', 'moderator', 'editor', 'partnership_manager', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'deactivated'],
      default: 'pending',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
