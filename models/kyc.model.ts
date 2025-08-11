import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================
export interface IKyc extends Document {
    kycId:string,
    userId: string;
    status:"PENDING" | "APPROVED" | "REJECTED",
    documents:{
        name:string,
        file:string
    }[],
    actionTime:Date,
    actionReason:string
    headers:any
}

const kycSchema = new Schema<IKyc>({
    kycId: {
        type: String,
        unique: true,
        trim:true,
    },
    status: {
        type: String,
        enum:["PENDING","APPROVED","REJECTED"],
        default:"PENDING"
    },
    userId: {
        type: String,
        required: true,
    },
    documents: {
        type:[{
            name:{
                type:String,
                required:true,
            },
            file:{
                type:String,
                required:true,
            },
        }],
        default:[],
        _id:false,
        id:false
    },
    actionTime:{
        type:Date,
        default:null
    },
    actionReason:{
        type:String,
        default:null
    },
    headers:{
      type:Object,
      default:{}
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


/**
 * Pre-save middleware to generate transactionId before saving
 */
kycSchema.pre('save', async function (next) {
    try {
      // Generate transactionId for new documents
      if (this.isNew && !this.kycId) {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yymmdd = `${yy}${mm}${dd}`;
        
        const uuid = uuidv4().substring(0, 8).toUpperCase();
        
        this.kycId = `KYC${uuid}`;
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });


  // ==================================================
// Model Export
// ==================================================

const kycModel = mongoose.model<IKyc>("kyc", kycSchema);

export { kycModel }; 
