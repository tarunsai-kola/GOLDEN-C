const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Config key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    values: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    category: {
      type: String,
      default: 'general',
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);

module.exports = PlatformConfig;
