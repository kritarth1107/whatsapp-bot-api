import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionCategory =
  | 'WALLET_TOP_UP'
  | 'CC_PAYMENT'
  | 'BANK_TRANSFER_PAYMENT'
  | 'ADMIN_DEDUCTION'
  | 'WALLET_TRANSFER'
  | 'INTEREST_CREDIT'
  | 'REFUND'
  | 'FEE_CHARGE'
  | 'REWARDS'
  | 'SAFE_WITHDRAW'
  | 'SAFE_DEPOSIT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type wallet = 'PRIMARY' | 'SAFE'

export interface TransactionDetails {
  party?: string;
  account?: string;
  description?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  paymentMethod?: string;
  gateway?: string;
  notes?: string;
}

export interface ITransaction extends Document {
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  status: TransactionStatus;
  details?: TransactionDetails;
  wallet:wallet,
  refNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsCompleted(): void;
  markAsFailed(): void;
  markAsCancelled(): void;
  updateStatus(status: TransactionStatus): void;
  addDetails(details: Partial<TransactionDetails>): void;
  getFormattedAmount(): string;
  isCredit(): boolean;
  isDebit(): boolean;
  isPending(): boolean;
  isCompleted(): boolean;
}

// ==================================================
// Schema Definitions
// ==================================================

const TransactionDetailsSchema = new Schema<TransactionDetails>(
  {
    party: { type: String, trim: true },
    account: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      unique: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      enum: [
        'WALLET_TOP_UP',
        'CC_PAYMENT',
        'BANK_TRANSFER_PAYMENT',
        'ADMIN_DEDUCTION',
        'WALLET_TRANSFER',
        'REFUND',
        'FEE_CHARGE',
        'REWARDS',
        'INTEREST_CREDIT',
        'SAFE_DEPOSIT',
        'SAFE_WITHDRAW'

      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    details: {
      type: TransactionDetailsSchema,
      default: {},
    },
    refNumber: {
      type: String,
      trim: true,
    },
    wallet:{
        type:String,
        required:true,
        enum:['PRIMARY','SAFE'],
        default:"PRIMARY"
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
 * Pre-save middleware to generate transactionId before saving
 */
transactionSchema.pre('save', async function (next) {
  try {
    // Generate transactionId for new documents
    if (this.isNew && !this.transactionId) {
      const date = new Date();
      const yy = String(date.getFullYear()).slice(2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      
      const uuid = uuidv4().substring(0, 8).toUpperCase();
      const typePrefix = this.type === 'CREDIT' ? 'C' : 'D';
      
      this.transactionId = `TXN${yymmdd}${typePrefix}${uuid}`;
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
transactionSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

/**
 * Virtual property for transaction type display
 */
transactionSchema.virtual('typeDisplay').get(function() {
  return this.type === 'CREDIT' ? 'Credit' : 'Debit';
});

/**
 * Virtual property for status display
 */
transactionSchema.virtual('statusDisplay').get(function() {
  return this.status.charAt(0) + this.status.slice(1).toLowerCase();
});

/**
 * Virtual property for category display
 */
transactionSchema.virtual('categoryDisplay').get(function() {
  return this.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Mark transaction as completed
 */
transactionSchema.methods.markAsCompleted = function(): void {
  this.status = 'COMPLETED';
};

/**
 * Mark transaction as failed
 */
transactionSchema.methods.markAsFailed = function(): void {
  this.status = 'FAILED';
};

/**
 * Mark transaction as cancelled
 */
transactionSchema.methods.markAsCancelled = function(): void {
  this.status = 'CANCELLED';
};

/**
 * Update transaction status
 * @param status - New status to set
 */
transactionSchema.methods.updateStatus = function(status: TransactionStatus): void {
  this.status = status;
};

/**
 * Add or update transaction details
 * @param details - Details to add or update
 */
transactionSchema.methods.addDetails = function(details: Partial<TransactionDetails>): void {
  this.details = { ...this.details, ...details };
};

/**
 * Get formatted amount with currency symbol
 * @returns Formatted amount string
 */
transactionSchema.methods.getFormattedAmount = function(): string {
  return `₹${this.amount.toFixed(2)}`;
};

/**
 * Check if transaction is credit
 * @returns True if credit transaction
 */
transactionSchema.methods.isCredit = function(): boolean {
  return this.type === 'CREDIT';
};

/**
 * Check if transaction is debit
 * @returns True if debit transaction
 */
transactionSchema.methods.isDebit = function(): boolean {
  return this.type === 'DEBIT';
};

/**
 * Check if transaction is pending
 * @returns True if pending
 */
transactionSchema.methods.isPending = function(): boolean {
  return this.status === 'PENDING';
};

/**
 * Check if transaction is completed
 * @returns True if completed
 */
transactionSchema.methods.isCompleted = function(): boolean {
  return this.status === 'COMPLETED';
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find transaction by transaction ID
 * @param transactionId - Transaction ID to search for
 * @returns Promise<ITransaction | null> - Transaction document or null
 */
transactionSchema.statics.findByTransactionId = function(transactionId: string) {
  return this.findOne({ transactionId });
};

/**
 * Find transactions by user ID
 * @param userId - User ID to search for
 * @returns Promise<ITransaction[]> - Array of transactions
 */
transactionSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Find transactions by wallet ID
 * @param walletId - Wallet ID to search for
 * @returns Promise<ITransaction[]> - Array of transactions
 */
transactionSchema.statics.findByWalletId = function(walletId: string) {
  return this.find({ walletId }).sort({ createdAt: -1 });
};

/**
 * Find completed transactions
 * @returns Promise<ITransaction[]> - Array of completed transactions
 */
transactionSchema.statics.findCompletedTransactions = function() {
  return this.find({ status: 'COMPLETED' });
};

/**
 * Find pending transactions
 * @returns Promise<ITransaction[]> - Array of pending transactions
 */
transactionSchema.statics.findPendingTransactions = function() {
  return this.find({ status: 'PENDING' });
};

/**
 * Find transactions by category
 * @param category - Transaction category
 * @returns Promise<ITransaction[]> - Array of transactions
 */
transactionSchema.statics.findByCategory = function(category: TransactionCategory) {
  return this.find({ category }).sort({ createdAt: -1 });
};

/**
 * Find transactions by date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Promise<ITransaction[]> - Array of transactions
 */
transactionSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

/**
 * Get transaction statistics for a user
 * @param userId - User ID
 * @returns Promise<object> - Transaction statistics
 */
transactionSchema.statics.getUserStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId, status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0]
          }
        },
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0]
          }
        },
        totalTransactions: { $sum: 1 },
        creditCount: {
          $sum: { $cond: [{ $eq: ['$type', 'CREDIT'] }, 1, 0] }
        },
        debitCount: {
          $sum: { $cond: [{ $eq: ['$type', 'DEBIT'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalCredit: 0,
    totalDebit: 0,
    totalTransactions: 0,
    creditCount: 0,
    debitCount: 0
  };
};

// ==================================================
// Model Export
// ==================================================

const transactionsModel = mongoose.model<ITransaction>('transactions', transactionSchema);

export { transactionsModel };
