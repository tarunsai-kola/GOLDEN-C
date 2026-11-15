const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['company', 'event', 'job', 'product'],
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

savedItemSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const SavedItem = mongoose.model('SavedItem', savedItemSchema);

module.exports = SavedItem;
