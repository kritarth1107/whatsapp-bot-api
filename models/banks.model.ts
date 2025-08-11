import mongoose, { Document, Schema } from "mongoose";

// ==================================================
// Types and Interfaces
// ==================================================

export interface IBanks extends Document {
    bankName: string;
    bankCode: string;
    bankLogo: string;
    type: "CC" | "BANK";
    isActive: boolean;
}

// ==================================================
// Schema Definition
// ==================================================

const banksSchema = new Schema<IBanks>({
    bankName: {
        type: String,
        required: true,
    },
    bankCode: {
        type: String,
        required: true,
        unique: true,
    },
    bankLogo: {
        type: String,
        required: true,
        default:"N/A"
    },
    type: {
        type: String,
        required: true,
        default:"CC"
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
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
  });

// ==================================================
// Model Export
// ==================================================

const banksModel = mongoose.model<IBanks>("banks", banksSchema);

export { banksModel }; 