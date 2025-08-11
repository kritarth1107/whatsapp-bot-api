import mongoose, { Document, Schema } from 'mongoose';

// ==================================================
// Types and Interfaces
// ==================================================

export type SecurityEventType =
  | 'LOGIN'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFIED'
  | 'MOBILE_VERIFIED'
  | '2FA_ENABLE'
  | '2FA_DISABLE';

export interface ISecurityLog extends Document {
  userId: string;
  type: SecurityEventType;
  status: boolean;
  description:string;
  headers: Object;
  createdAt: Date;
  updatedAt: Date;
}

// ==================================================
// Schema Definition
// ==================================================

const securityLogSchema = new Schema<ISecurityLog>(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['LOGIN', 'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE','EMAIL_VERIFIED','MOBILE_VERIFIED'],
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    headers: {
      type: Object,
      default:{}
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
// Model Export
// ==================================================

const securityLogsModel = mongoose.model<ISecurityLog>('securityLogs', securityLogSchema);

export { securityLogsModel };
