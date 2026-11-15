const mongoose = require('mongoose');

const jobReportSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for report is required'],
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    details: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

jobReportSchema.index({ jobId: 1, reportedBy: 1 });

const JobReport = mongoose.model('JobReport', jobReportSchema);

module.exports = JobReport;
