import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export type TopUpMethod = 'UPI' | 'CASH_DEPOSIT' | 'NEFT' | 'RTGS' | 'IMPS' | "OFFICE_DEPOSIT";
export type TopUpStatus = 'PENDING' | 'SUCCESS' | 'REJECTED';

export interface BankDetails {
  name?: string;
  account?: string;
  refNumber?: string;
}

export interface IWalletTopUpRequest extends Document {
  requestId: string;
  userId: string;
  amount: number;
  method: TopUpMethod;
  bank: BankDetails;
  fileUrl?: string;
  status: TopUpStatus;
  approvalTime?: Date;
  rejectionTime?: Date;
  rejectionReason?: string;
  wallet:string,
  additional:any,
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  approve(): void;
  reject(reason: string): void;
  isPending(): boolean;
  isApproved(): boolean;
  isRejected(): boolean;
  getFormattedAmount(): string;
  getMethodDisplay(): string;
  getStatusDisplay(): string;
}

// ==================================================
// Schema Definitions
// ==================================================

const BankDetailsSchema = new Schema<BankDetails>(
  {
    name: { type: String, trim: true },
    account: { type: String, trim: true },
    refNumber: { type: String, trim: true, default:"N/A" },
  },
  { _id: false }
);

const walletTopUpRequestSchema = new Schema<IWalletTopUpRequest>(
  {
    requestId: {
      type: String,
      unique: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: ['UPI', 'CASH_DEPOSIT', 'NEFT', 'RTGS', 'IMPS',"OFFICE_DEPOSIT"],
      required: true,
    },
    bank: {
      type: BankDetailsSchema,
      required:true
    },
    fileUrl: {
      type: String,
      trim: true,
      default:"N/A"
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'REJECTED'],
      default: 'PENDING',
    },
    approvalTime: {
      type: Date,
      default:null
    },
    rejectionTime: {
      type: Date,
      default:null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default:null
    },
    wallet:{
        type:String,
        default:"PRIMARY",
        enum:['PRIMARY','SAFE']
    },
    additional:{
      type:Object,
      default:{
        date:"1967-Jan-01",
        txId:"N/A",
        atmId:"N/A",
        location:"N/A",
        remarks:"N/A",
      }
    }
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

/**
 * Pre-save middleware to generate requestId before saving
 */
walletTopUpRequestSchema.pre('save', async function (next) {
  try {
    // Generate requestId for new documents
    if (this.isNew && !this.requestId) {
      const date = new Date();
      const yy = String(date.getFullYear()).slice(2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      
      const uuid = uuidv4().substring(0, 8).toUpperCase();
      
      this.requestId = `TOPUP${yymmdd}${uuid}`;
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================================================
// Virtual Properties
// ==================================================

/**
 * Virtual property for formatted amount with currency
 */
walletTopUpRequestSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

/**
 * Virtual property for method display
 */
walletTopUpRequestSchema.virtual('methodDisplay').get(function() {
  return this.method.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
});

/**
 * Virtual property for status display
 */
walletTopUpRequestSchema.virtual('statusDisplay').get(function() {
  return this.status.charAt(0) + this.status.slice(1).toLowerCase();
});

/**
 * Virtual property for processing time
 */
walletTopUpRequestSchema.virtual('processingTime').get(function() {
  if (this.status === 'PENDING') return null;
  
  const endTime = this.status === 'SUCCESS' ? this.approvalTime : this.rejectionTime;
  if (!endTime) return null;
  
  const diffMs = endTime.getTime() - this.createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Approve the top-up request
 */
walletTopUpRequestSchema.methods.approve = function(): void {
  this.status = 'SUCCESS';
  this.approvalTime = new Date();
};

/**
 * Reject the top-up request
 * @param reason - Reason for rejection
 */
walletTopUpRequestSchema.methods.reject = function(reason: string): void {
  this.status = 'REJECTED';
  this.rejectionTime = new Date();
  this.rejectionReason = reason;
};

/**
 * Check if request is pending
 * @returns True if pending
 */
walletTopUpRequestSchema.methods.isPending = function(): boolean {
  return this.status === 'PENDING';
};

/**
 * Check if request is approved
 * @returns True if approved
 */
walletTopUpRequestSchema.methods.isApproved = function(): boolean {
  return this.status === 'SUCCESS';
};

/**
 * Check if request is rejected
 * @returns True if rejected
 */
walletTopUpRequestSchema.methods.isRejected = function(): boolean {
  return this.status === 'REJECTED';
};

/**
 * Get formatted amount with currency symbol
 * @returns Formatted amount string
 */
walletTopUpRequestSchema.methods.getFormattedAmount = function(): string {
  return `₹${this.amount.toFixed(2)}`;
};

/**
 * Get method display name
 * @returns Method display string
 */
walletTopUpRequestSchema.methods.getMethodDisplay = function(): string {
  return this.method.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

/**
 * Get status display name
 * @returns Status display string
 */
walletTopUpRequestSchema.methods.getStatusDisplay = function(): string {
  return this.status.charAt(0) + this.status.slice(1).toLowerCase();
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find request by request ID
 * @param requestId - Request ID to search for
 * @returns Promise<IWalletTopUpRequest | null> - Request document or null
 */
walletTopUpRequestSchema.statics.findByRequestId = function(requestId: string) {
  return this.findOne({ requestId });
};

/**
 * Find requests by user ID
 * @param userId - User ID to search for
 * @returns Promise<IWalletTopUpRequest[]> - Array of requests
 */
walletTopUpRequestSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Find pending requests
 * @returns Promise<IWalletTopUpRequest[]> - Array of pending requests
 */
walletTopUpRequestSchema.statics.findPendingRequests = function() {
  return this.find({ status: 'PENDING' }).sort({ createdAt: -1 });
};

/**
 * Find approved requests
 * @returns Promise<IWalletTopUpRequest[]> - Array of approved requests
 */
walletTopUpRequestSchema.statics.findApprovedRequests = function() {
  return this.find({ status: 'SUCCESS' }).sort({ createdAt: -1 });
};

/**
 * Find rejected requests
 * @returns Promise<IWalletTopUpRequest[]> - Array of rejected requests
 */
walletTopUpRequestSchema.statics.findRejectedRequests = function() {
  return this.find({ status: 'REJECTED' }).sort({ createdAt: -1 });
};

/**
 * Find requests by method
 * @param method - Top-up method
 * @returns Promise<IWalletTopUpRequest[]> - Array of requests
 */
walletTopUpRequestSchema.statics.findByMethod = function(method: TopUpMethod) {
  return this.find({ method }).sort({ createdAt: -1 });
};

/**
 * Find requests by date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Promise<IWalletTopUpRequest[]> - Array of requests
 */
walletTopUpRequestSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

/**
 * Get top-up request statistics for a user
 * @param userId - User ID
 * @returns Promise<object> - Request statistics
 */
walletTopUpRequestSchema.statics.getUserStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalRequests: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'PENDING'] }, '$amount', 0]
          }
        },
        approvedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'SUCCESS'] }, '$amount', 0]
          }
        },
        rejectedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'REJECTED'] }, '$amount', 0]
          }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalAmount: 0,
    totalRequests: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  };
};

// ==================================================
// Model Export
// ==================================================

const walletTopUpRequestsModel = mongoose.model<IWalletTopUpRequest>('walletTopUpRequests', walletTopUpRequestSchema);

export { walletTopUpRequestsModel };
