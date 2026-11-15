const mongoose = require('mongoose');

const savedCompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
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

// Compound unique index ensuring each user can save a company only once
savedCompanySchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const SavedCompany = mongoose.model('SavedCompany', savedCompanySchema);

module.exports = SavedCompany;
