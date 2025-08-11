import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================
export type DepositBankTypes =
  | "UPI"
  | "IMPS"
  | "RTGS"
  | "NEFT"
  | "CASH_DEPOSIT"
  | "OFFICE_CASH";

export interface IDepositBanks extends Document {
  depId: String;
  bankName: string;
  bankIFSC: string;
  bankLogo: string;
  bankAccountNumber: string;
  bankAccountName: string;
  upiCode: string;
  type: DepositBankTypes;
  isActive:boolean;
}

const depositBanksSchema = new Schema<IDepositBanks>(
  {
    depId: {
      type: String,
      unique: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    bankIFSC: {
      type: String,
      required: true,
      trim: true,
    },
    bankLogo: {
      type: String,
      required: true,
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankAccountName: {
      type: String,
      required: true,
      trim: true,
    },
    upiCode: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["UPI", "IMPS", "RTGS", "NEFT", "CASH_DEPOSIT", "OFFICE_CASH"],
      required: true,
      trim: true,
    },
    isActive:{
        type:Boolean,
        default:true
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

/**
 * Pre-save middleware to generate transactionId before saving
 */
depositBanksSchema.pre('save', async function (next) {
    try {
      // Generate transactionId for new documents
      if (this.isNew && !this.depId) {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yymmdd = `${yy}${mm}${dd}`;
        
        const uuid = uuidv4().substring(0, 8).toUpperCase();
        
        this.depId = `DEP${uuid}`;
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });


  // ==================================================
// Model Export
// ==================================================

const depositBanksModel = mongoose.model<IDepositBanks>("deposit_banks", depositBanksSchema);

export { depositBanksModel }; 