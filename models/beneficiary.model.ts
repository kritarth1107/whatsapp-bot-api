import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================

export interface IBeneficiary extends Document {
    beneficiaryId:string,
    userId: string;
    type:"CC" | "BANK",
    mobileNumber:string;
    banks:{
        holder:string,
        accountNumber:string,
        ifscCode:string,
        bankCode:string,
        bankName:string,
        bankLogo:string,
    }[];
}


// ==================================================
// Schema Definition
// ==================================================

const beneficiarySchema = new Schema<IBeneficiary>({
    beneficiaryId: {
        type: String,
        unique: true,
        trim:true,
    },
    type: {
        type: String,
        enum:["CC","BANK"],
        default:"CC"
    },
    userId: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    banks: {
        type:[{
            holder:{
                type:String,
                required:true,
            },
            accountNumber:{
                type:String,
                required:true,
            },
            ifscCode:{
                type:String,
                required:true,
            },
            bankCode:{
                type:String,
                required:true,
            },
            bankName:{
                type:String,
                required:true,
            },
            bankLogo:{
                type:String,
                default:"N/A"
            },
        }],
        default:[]
    }
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
  });

  // ==================================================
// Middleware
// ==================================================

/**
 * Pre-save middleware to generate transactionId before saving
 */
beneficiarySchema.pre('save', async function (next) {
    try {
      // Generate transactionId for new documents
      if (this.isNew && !this.beneficiaryId) {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yymmdd = `${yy}${mm}${dd}`;
        
        const uuid = uuidv4().substring(0, 8).toUpperCase();
        const typePrefix = this.type === 'CC' ? 'CC' : 'BANK';
        
        this.beneficiaryId = `BEN${yymmdd}${typePrefix}${uuid}`;
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });


  // ==================================================
// Model Export
// ==================================================

const beneficiaryModel = mongoose.model<IBeneficiary>("beneficiary", beneficiarySchema);

export { beneficiaryModel }; 