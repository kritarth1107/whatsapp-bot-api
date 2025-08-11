import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export type PaymentType = 'CC_PAYMENT' | 'BANK_TRANSFER' | 'OTHERS';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentDetail {
  name?: string;
  account?: string;
  mobile?: string;
  holder?: string;
  type?: string;
  ifsc?: string;
}

export interface IPayment extends Document {
  userId: string;
  paymentId: string;
  description?: string;
  type: PaymentType;
  amount: number;
  fee:number;
  detail?: PaymentDetail;
  status: PaymentStatus;
  actionTime?: Date;
  actionReason?: string;
  referance?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  complete(): void;
  fail(reason: string): void;
  isPending(): boolean;
  isCompleted(): boolean;
  isFailed(): boolean;
  getFormattedAmount(): string;
  getTypeDisplay(): string;
  getStatusDisplay(): string;
}

// ==================================================
// Schema Definitions
// ==================================================

const PaymentDetailSchema = new Schema<PaymentDetail>(
  {
    name: { type: String, trim: true },
    account: { type: String, trim: true },
    mobile: { type: String, trim: true },
    holder: { type: String, trim: true },
    type: { type: String, trim: true },
    ifsc: { type: String, trim: true },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['CC_PAYMENT', 'BANK_TRANSFER', 'OTHERS'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10,
    },
    fee: {
      type: Number,
      default:0,
      min:0.01
    },
    detail: {
      type: PaymentDetailSchema,
      required:true
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    actionTime: {
      type: Date,
      default:null,
    },
    actionReason: {
      type: String,
      default:null,
      trim: true,
    },
    referance: {
      default:null,
      type: String,
      trim: true,
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

/**
 * Pre-save middleware to generate paymentId before saving
 */
paymentSchema.pre('save', async function (next) {
  try {
    // Generate paymentId for new documents
    if (this.isNew && !this.paymentId) {
      const date = new Date();
      const yy = String(date.getFullYear()).slice(2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      
      const uuid = uuidv4().substring(0, 8).toUpperCase();
      
      this.paymentId = `PAY${yymmdd}${uuid}`;
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
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

/**
 * Virtual property for type display
 */
paymentSchema.virtual('typeDisplay').get(function() {
  return this.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
});

/**
 * Virtual property for status display
 */
paymentSchema.virtual('statusDisplay').get(function() {
  return this.status.charAt(0) + this.status.slice(1).toLowerCase();
});

/**
 * Virtual property for processing time
 */
paymentSchema.virtual('processingTime').get(function() {
  if (this.status === 'PENDING') return null;
  
  const endTime = this.actionTime;
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
 * Complete the payment
 */
paymentSchema.methods.complete = function(): void {
  this.status = 'COMPLETED';
  this.actionTime = new Date();
};

/**
 * Fail the payment
 * @param reason - Reason for failure
 */
paymentSchema.methods.fail = function(reason: string): void {
  this.status = 'FAILED';
  this.actionTime = new Date();
  this.actionReason = reason;
};

/**
 * Check if payment is pending
 * @returns True if pending
 */
paymentSchema.methods.isPending = function(): boolean {
  return this.status === 'PENDING';
};

/**
 * Check if payment is completed
 * @returns True if completed
 */
paymentSchema.methods.isCompleted = function(): boolean {
  return this.status === 'COMPLETED';
};

/**
 * Check if payment is failed
 * @returns True if failed
 */
paymentSchema.methods.isFailed = function(): boolean {
  return this.status === 'FAILED';
};

/**
 * Get formatted amount with currency symbol
 * @returns Formatted amount string
 */
paymentSchema.methods.getFormattedAmount = function(): string {
  return `₹${this.amount.toFixed(2)}`;
};

/**
 * Get type display name
 * @returns Type display string
 */
paymentSchema.methods.getTypeDisplay = function(): string {
  return this.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

/**
 * Get status display name
 * @returns Status display string
 */
paymentSchema.methods.getStatusDisplay = function(): string {
  return this.status.charAt(0) + this.status.slice(1).toLowerCase();
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find payment by payment ID
 * @param paymentId - Payment ID to search for
 * @returns Promise<IPayment | null> - Payment document or null
 */
paymentSchema.statics.findByPaymentId = function(paymentId: string) {
  return this.findOne({ paymentId });
};

/**
 * Find payments by user ID
 * @param userId - User ID to search for
 * @returns Promise<IPayment[]> - Array of payments
 */
paymentSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Find pending payments
 * @returns Promise<IPayment[]> - Array of pending payments
 */
paymentSchema.statics.findPendingPayments = function() {
  return this.find({ status: 'PENDING' }).sort({ createdAt: -1 });
};

/**
 * Find completed payments
 * @returns Promise<IPayment[]> - Array of completed payments
 */
paymentSchema.statics.findCompletedPayments = function() {
  return this.find({ status: 'COMPLETED' }).sort({ createdAt: -1 });
};

/**
 * Find failed payments
 * @returns Promise<IPayment[]> - Array of failed payments
 */
paymentSchema.statics.findFailedPayments = function() {
  return this.find({ status: 'FAILED' }).sort({ createdAt: -1 });
};

/**
 * Find payments by type
 * @param type - Payment type
 * @returns Promise<IPayment[]> - Array of payments
 */
paymentSchema.statics.findByType = function(type: PaymentType) {
  return this.find({ type }).sort({ createdAt: -1 });
};

/**
 * Find payments by date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Promise<IPayment[]> - Array of payments
 */
paymentSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

/**
 * Get payment statistics for a user
 * @param userId - User ID
 * @returns Promise<object> - Payment statistics
 */
paymentSchema.statics.getUserStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'PENDING'] }, '$amount', 0]
          }
        },
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$amount', 0]
          }
        },
        failedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'FAILED'] }, '$amount', 0]
          }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalAmount: 0,
    totalPayments: 0,
    pendingAmount: 0,
    completedAmount: 0,
    failedAmount: 0,
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0
  };
};

// ==================================================
// Model Export
// ==================================================

const paymentsModel = mongoose.model<IPayment>('payments', paymentSchema);

export { paymentsModel };
