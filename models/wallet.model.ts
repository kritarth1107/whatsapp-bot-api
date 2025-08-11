import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export type WalletStatus = 'ACTIVE' | 'BLOCKED' | 'FROZEN';

export interface IWallet extends Document {
    userId:string;
  walletId: string;
  primaryWalletBalance: number;
  safeWalletBalance: number;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addToPrimaryBalance(amount: number): void;
  subtractFromPrimaryBalance(amount: number): void;
  addToSafeBalance(amount: number): void;
  subtractFromSafeBalance(amount: number): void;
  getTotalBalance(): number;
  isWalletActive(): boolean;
  block(): void;
  freeze(): void;
  activate(): void;
}

// ==================================================
// Schema Definition
// ==================================================

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    walletId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    primaryWalletBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    safeWalletBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'FROZEN'],
      default: 'ACTIVE',
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
// Middleware
// ==================================================

/**
 * Pre-save middleware to generate walletId before saving
 */
walletSchema.pre('save', async function (next) {
  try {
    // Generate walletId for new documents
    if (this.isNew && !this.walletId) {
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
      const date = new Date();

      const yy = String(date.getFullYear()).slice(2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yymm = `${yy}${mm}`;

      const uuid = uuidv4().substring(0, 8).toUpperCase()

      this.walletId = `W${yymm}${uuid}`;
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
 * Virtual property for total balance
 */
walletSchema.virtual('totalBalance').get(function() {
  return this.primaryWalletBalance + this.safeWalletBalance;
});

/**
 * Virtual property to check if wallet is active
 */
walletSchema.virtual('isActiveStatus').get(function() {
  return this.status === 'ACTIVE';
});


// ==================================================
// Instance Methods
// ==================================================

/**
 * Add amount to primary wallet balance
 * @param amount - Amount to add
 */
walletSchema.methods.addToPrimaryBalance = function(amount: number): void {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  this.primaryWalletBalance += amount;
};

/**
 * Subtract amount from primary wallet balance
 * @param amount - Amount to subtract
 */
walletSchema.methods.subtractFromPrimaryBalance = function(amount: number): void {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  if (this.primaryWalletBalance < amount) {
    throw new Error('Insufficient balance in primary wallet');
  }
  this.primaryWalletBalance -= amount;
};

/**
 * Add amount to safe wallet balance
 * @param amount - Amount to add
 */
walletSchema.methods.addToSafeBalance = function(amount: number): void {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  this.safeWalletBalance += amount;
};

/**
 * Subtract amount from safe wallet balance
 * @param amount - Amount to subtract
 */
walletSchema.methods.subtractFromSafeBalance = function(amount: number): void {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  if (this.safeWalletBalance < amount) {
    throw new Error('Insufficient balance in safe wallet');
  }
  this.safeWalletBalance -= amount;
};

/**
 * Get total balance across both wallets
 * @returns Total balance
 */
walletSchema.methods.getTotalBalance = function(): number {
  return this.primaryWalletBalance + this.safeWalletBalance;
};

/**
 * Check if wallet is active
 * @returns True if wallet is active
 */
walletSchema.methods.isWalletActive = function(): boolean {
  return this.status === 'ACTIVE';
};

/**
 * Block the wallet
 */
walletSchema.methods.block = function(): void {
  this.status = 'BLOCKED';
};

/**
 * Freeze the wallet
 */
walletSchema.methods.freeze = function(): void {
  this.status = 'FROZEN';
};

/**
 * Activate the wallet
 */
walletSchema.methods.activate = function(): void {
  this.status = 'ACTIVE';
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find wallet by wallet ID
 * @param walletId - Wallet ID to search for
 * @returns Promise<IWallet | null> - Wallet document or null
 */
walletSchema.statics.findByWalletId = function(walletId: string) {
  return this.findOne({ walletId });
};

/**
 * Find active wallets
 * @returns Promise<IWallet[]> - Array of active wallets
 */
walletSchema.statics.findActiveWallets = function() {
  return this.find({ status: 'ACTIVE' });
};

/**
 * Find wallets with balance above threshold
 * @param threshold - Minimum balance threshold
 * @returns Promise<IWallet[]> - Array of wallets above threshold
 */
walletSchema.statics.findWalletsAboveBalance = function(threshold: number) {
  return this.find({
    $expr: {
      $gte: [
        { $add: ['$primaryWalletBalance', '$safeWalletBalance'] },
        threshold
      ]
    }
  });
};

// ==================================================
// Model Export
// ==================================================

const walletsModel = mongoose.model<IWallet>('wallets', walletSchema);

export { walletsModel };
