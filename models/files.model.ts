import mongoose, { Document, Schema } from "mongoose";

// ==================================================
// Types and Interfaces
// ==================================================

export interface IFile extends Document {
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

// ==================================================
// Schema Definition
// ==================================================

const fileSchema = new Schema<IFile>(
  {
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret._id;
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret._id;
        delete ret.id;
        return ret;
      },
    },
  }
);

// ==================================================
// Model Export
// ==================================================

const filesModel = mongoose.model<IFile>("files", fileSchema);

export { filesModel }; 