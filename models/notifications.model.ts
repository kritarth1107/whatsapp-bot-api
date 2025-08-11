// models/notification.model.ts

import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ==================================================
// Types and Interfaces
// ==================================================

export type NotificationType = "ALL_USERS" | "SPECEFIC_USER";
export type NotificationCategory = "INFO" | "ERROR" | "SUCCESS" | "WARNING";
export type NotificationSender = "SYSTEM" | "SECURITY" | "PAYMENTS";

export interface INotification extends Document {
  notificationId: string;
  notificationType: NotificationType;
  userId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: NotificationCategory;
  sender: NotificationSender;
  readStatus: boolean;
  deletedByUser: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsRead(): void;
  markAsUnread(): void;
  markAsDeleted(): void;
  restore(): void;
}

// ==================================================
// Schema Definitions
// ==================================================

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: {
      type: String,
      unique: true,
      trim: true,
    },
    notificationType: {
      type: String,
      enum: ["ALL_USERS", "SPECEFIC_USER"],
      required: true,
    },
    userId: {
        type: String,
        ref: "users",
      required: function () {
        return this.notificationType === "SPECEFIC_USER";
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["INFO", "ERROR", "SUCCESS", "WARNING"],
      required: true,
    },
    sender: {
      type: String,
      enum: ["SYSTEM", "SECURITY", "PAYMENTS"],
      required: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    deletedByUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).id;
        return ret;
      },
    },
  }
);

// ==================================================
// Middleware
// ==================================================

NotificationSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.notificationId) {
      const date = new Date();
      const yy = String(date.getFullYear()).slice(2);
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yymmdd = `${yy}${mm}${dd}`;
      const uuid = uuidv4().substring(0, 8).toUpperCase();
      this.notificationId = `NTF${yymmdd}${uuid}`;
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================================================
// Virtual Properties
// ==================================================

NotificationSchema.virtual("categoryDisplay").get(function () {
  return this.type.charAt(0) + this.type.slice(1).toLowerCase();
});

NotificationSchema.virtual("senderDisplay").get(function () {
  return this.sender.charAt(0) + this.sender.slice(1).toLowerCase();
});

// ==================================================
// Instance Methods
// ==================================================

NotificationSchema.methods.markAsRead = function (): void {
  this.readStatus = true;
};

NotificationSchema.methods.markAsUnread = function (): void {
  this.readStatus = false;
};

NotificationSchema.methods.markAsDeleted = function (): void {
  this.deletedByUser = true;
};

NotificationSchema.methods.restore = function (): void {
  this.deletedByUser = false;
};

// ==================================================
// Static Methods
// ==================================================

NotificationSchema.statics.findByNotificationId = function (notificationId: string) {
  return this.findOne({ notificationId });
};

NotificationSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findUnreadByUserId = function (userId: string) {
  return this.find({ userId, readStatus: false, deletedByUser: false }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findAllForUser = function (userId: string) {
  return this.find({ $or: [
    { notificationType: "ALL_USERS" },
    { notificationType: "SPECEFIC_USER", userId }
  ], deletedByUser: false }).sort({ createdAt: -1 });
};

// ==================================================
// Model Export
// ==================================================

const notificationsModel = mongoose.model<INotification>("notifications", NotificationSchema);

export { notificationsModel };
