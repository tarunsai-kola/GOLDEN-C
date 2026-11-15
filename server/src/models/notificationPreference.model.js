const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    emailInvitations: {
      type: Boolean,
      default: true,
    },
    emailConnections: {
      type: Boolean,
      default: true,
    },
    emailMessages: {
      type: Boolean,
      default: true,
    },
    emailEventReminders: {
      type: Boolean,
      default: true,
    },
    emailJobUpdates: {
      type: Boolean,
      default: true,
    },
    emailMarketing: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationPreference = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);

module.exports = NotificationPreference;
