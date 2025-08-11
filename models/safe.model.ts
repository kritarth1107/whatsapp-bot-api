import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// ==================================================
// Types and Interfaces
// ==================================================


export interface ISafe extends Document {
  safeId: string;
  userId:string;
  amount: number;
  startDate: number;
  endDate: number;
  withdrawDate: number;
  interest: number;
  interestUpdated:boolean;
  isWithdrawn: boolean;
}


const safeSchema = new Schema<ISafe>(
    {
        safeId: {
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
        trim: true,
      },
      startDate: {
        type: Number,
        required: true,
        trim: true,
      },
      endDate: {
        type: Number,
        required: true,
        trim: true,
      },
      withdrawDate: {
        type: Number,
        default: 0,
        trim: true,
      },
      interest: {
        type: Number,
        default: 0,
        trim: true,
      },
      isWithdrawn: {
        type: Boolean,
        default: false,
        trim: true,
      },
      interestUpdated:{
        type:Boolean,
        default:false,
        trim:true,
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
   * Pre-save middleware to generate safeId before saving
   * Generates safe IDs in two formats:
   * - 6-digit format: SW0001, SW0002, ..., SW9999 (first 9999 deposits)
   * - 8-digit format: SW00000001, SW00000002, ... (after 9999 deposits)
   * Automatically switches to 8-digit format when 6-digit limit is reached
   */
  safeSchema.pre('save', async function (next) {
    try {
      // Generate safeId for new documents only
      if (this.isNew && !this.safeId) {
        // ===== FIND THE HIGHEST EXISTING SAFE ID (6-DIGIT FORMAT) =====
        // First, try to find the highest 6-digit safe ID (SW0001 to SW9999)
        const lastSafe6Digit = await mongoose.model('safe').findOne(
          { safeId: { $regex: /^SW\d{4}$/ } }, // Match SW followed by exactly 4 digits
          { safeId: 1 },
          { sort: { safeId: -1 } } // Sort in descending order to get the highest
        );

        // ===== FIND THE HIGHEST EXISTING SAFE ID (8-DIGIT FORMAT) =====
        // Also check for 8-digit safe IDs (SW00000001 and beyond)
        const lastSafe8Digit = await mongoose.model('safe').findOne(
          { safeId: { $regex: /^SW\d{8}$/ } }, // Match SW followed by exactly 8 digits
          { safeId: 1 },
          { sort: { safeId: -1 } } // Sort in descending order to get the highest
        );

        // ===== DETERMINE NEXT SAFE ID NUMBER =====
        let nextNumber = 1; // Default to 1 if no existing safe deposits
        let use8DigitFormat = false; // Flag to determine format

        if (lastSafe6Digit && lastSafe6Digit.safeId) {
          // Extract the number from the last 6-digit safe ID (e.g., "SW0001" -> "0001" -> 1)
          const lastNumber = parseInt(lastSafe6Digit.safeId.substring(2), 10);
          
          if (lastNumber >= 9999) {
            // 6-digit format is full, switch to 8-digit format
            use8DigitFormat = true;
            
            if (lastSafe8Digit && lastSafe8Digit.safeId) {
              // Extract the number from the last 8-digit safe ID (e.g., "SW00000001" -> "00000001" -> 1)
              const last8DigitNumber = parseInt(lastSafe8Digit.safeId.substring(2), 10);
              nextNumber = last8DigitNumber + 1;
            } else {
              // First 8-digit safe ID after 9999
              nextNumber = 1;
            }
          } else {
            // Continue with 6-digit format
            nextNumber = lastNumber + 1;
          }
        } else if (lastSafe8Digit && lastSafe8Digit.safeId) {
          // Only 8-digit safe IDs exist, continue with 8-digit format
          use8DigitFormat = true;
          const last8DigitNumber = parseInt(lastSafe8Digit.safeId.substring(2), 10);
          nextNumber = last8DigitNumber + 1;
        }

        // ===== GENERATE NEW SAFE ID =====
        if (use8DigitFormat) {
          // Format: SW + 8-digit number with leading zeros
          this.safeId = `SW${String(nextNumber).padStart(8, '0')}`;
        } else {
          // Format: SW + 4-digit number with leading zeros
          this.safeId = `SW${String(nextNumber).padStart(4, '0')}`;
        }
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });


  // ==================================================
// Model Export
// ==================================================

const safeModel = mongoose.model<ISafe>("safe", safeSchema);

export { safeModel }; 