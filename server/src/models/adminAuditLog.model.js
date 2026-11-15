const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user ID is required'],
      index: true,
    },
    adminRole: {
      type: String,
      default: 'super_admin',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: [
        'user',
        'organization',
        'event',
        'job',
        'message',
        'report',
        'cms',
        'config',
        'system',
      ],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      default: '',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

adminAuditLogSchema.index({ createdAt: -1 });

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
