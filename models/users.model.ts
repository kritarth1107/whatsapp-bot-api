import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/app.config';
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export type UserFlag = 'ACTIVE' | 'BLOCKED' | 'PENDINGKYC' | 'REJECTEDKYC';

export interface MFA {
  isEnabled: boolean;
  secret: string;
}

export interface LastLogin {
  time: Date;
  ipAddress?: string;
  agent?: string;
  device?:string;
}

export interface IUser extends Document {
  userId:string;
  displayName: string;
  email: string;
  mobileNumber: string;
  kycID: string;
  password: string;
  passwordScore:number;
  mfa: MFA;
  walletId: string;
  flag: UserFlag;
  lastLogin?: LastLogin;
  failedLoginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  inviteCode:string;
  emailVerified:boolean;
  mobileVerified:boolean;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetFailedLoginAttempts(): void;
  incrementFailedLoginAttempts(): void;
  updateLastLogin(ipAddress?: string, agent?: string): void;
}

// ==================================================
// Schema Definitions
// ==================================================

const MFASchema = new Schema<MFA>(
  {
    isEnabled: { type: Boolean, default: false },
    secret: { type: String },
  },
  { _id: false }
);

const LastLoginSchema = new Schema<LastLogin>(
  {
    time: { type: Date },
    ipAddress: { type: String },
    agent: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    userId:{
        type: String,
        unique: true,
        trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    kycID: {
      type: String,
      required: true,
      trim: true,
      default:"PENDING"
    },
    emailVerified:{
      type:Boolean,
      default:false
    },
    mobileVerified:{
      type:Boolean,
      default:false
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    passwordScore: {
      type: Number,
      required: true,
      default: 0,
    },
    mfa: {
      type: MFASchema,
      default: { isEnabled: false, secret:"N/A" },
    },
    walletId: {
      type: String,
      required: true,
      trim: true,
    },
    flag: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'PENDINGKYC', 'REJECTEDKYC'],
      default: 'PENDINGKYC',
    },
    lastLogin: {
      type: LastLoginSchema,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    inviteCode:{
      type:String,
      required:true,
      trim:true,
      unique:true,
      default:"N/A"
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).id;
        delete (ret as any).password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).id;
        delete (ret as any).password;
        return ret;
      },
    },
  }
);

// ==================================================
// Middleware
// ==================================================

/**
 * Pre-save middleware to generate userId and hash password before saving
 */
userSchema.pre('save', async function (next) {
  try {
    // Generate userId for new documents
    if (this.isNew && !this.userId) {
      const uid = `${uuidv4().substring(0, 8).toUpperCase()}` // Unix timestamp
      this.userId = `${uid}`;
    }       

    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
      return next();
    }

    // Hash password with bcrypt
    const saltRounds = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Pre-update middleware to hash password before updating
 */
userSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() as any;
    
    // Only hash password if it's being updated
    if (update.password) {
      const saltRounds = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, saltRounds);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================================================
// Instance Methods
// ==================================================

/**
 * Compare password with hashed password
 * @param candidatePassword - Password to compare
 * @returns Promise<boolean> - True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Reset failed login attempts
 */
userSchema.methods.resetFailedLoginAttempts = function (): void {
  this.failedLoginAttempts = 0;
};

/**
 * Increment failed login attempts
 */
userSchema.methods.incrementFailedLoginAttempts = function (): void {
  this.failedLoginAttempts += 1;
};

/**
 * Update last login information
 * @param ipAddress - IP address of the login
 * @param agent - User agent string
 */
userSchema.methods.updateLastLogin = function (ipAddress?: string, agent?: string): void {
  this.lastLogin = {
    time: new Date(),
    ipAddress,
    agent,
  };
};

// ==================================================
// Static Methods
// ==================================================

/**
 * Find user by email
 * @param email - User email
 * @returns Promise<IUser | null> - User document or null
 */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by mobile number
 * @param mobileNumber - User mobile number
 * @returns Promise<IUser | null> - User document or null
 */
userSchema.statics.findByMobileNumber = function (mobileNumber: string) {
  return this.findOne({ mobileNumber });
};

/**
 * Find user by wallet ID
 * @param walletId - User wallet ID
 * @returns Promise<IUser | null> - User document or null
 */
userSchema.statics.findByWalletId = function (walletId: string) {
  return this.findOne({ walletId });
};

// ==================================================
// Model Export
// ==================================================

userSchema.index(
  { kycID: 1 },
  { unique: true, partialFilterExpression: { kycID: { $ne: "PENDING" } } }
);

const usersModel = mongoose.model<IUser>('users', userSchema);

export { usersModel };
