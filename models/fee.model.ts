import mongoose, { Document, Schema } from "mongoose";
import { PaymentType } from "./payments.model";
import { v4 as uuidv4 } from "uuid";

// ==================================================
// Types and Interfaces
// ==================================================
export type FeeType = "FLAT" | "PERCENTAGE"


export interface IFees extends Document {
  feeId:string;
  paymentType: PaymentType;
  feeType:FeeType;
  fee:number;
  minAmount:number;
  maxAmount:number;
  anyUpperLimit:boolean;
}


// ==================================================
// Schema Definitions
// ==================================================\

const FeeSchema = new Schema<IFees>(
    {
        feeId: {
            type: String,
            unique: true,
            trim: true,
        },
        paymentType:{
            type: String,
            enum: ["CC_PAYMENT", "BANK_TRANSFER", "OTHERS"],
            required: true,
        },
        feeType:{
            type: String,
            enum: ["FLAT", "PERCENTAGE"],
            required: true,
        },
        fee:{
            type: Number,
            required: true,
            default:0,
        },
        minAmount:{
            type: Number,
            default:0,
        },
        maxAmount:{
            type: Number,
            default:0,
        },
        anyUpperLimit:{
            type:Boolean,
            default:false
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
)

// ==================================================
// Middleware
// ==================================================

FeeSchema.pre("save", async function (next) {
    try {
      if (this.isNew && !this.feeId) {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const yymmdd = `${yy}${mm}${dd}`;
        const uuid = uuidv4().substring(0, 8).toUpperCase();
        this.feeId = `FEE${yymmdd}${uuid}`;
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });

// ==================================================
// Model Export
// ==================================================

const feesModel = mongoose.model<IFees>("fees", FeeSchema);

export { feesModel };
