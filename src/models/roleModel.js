import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      enum: ['admin', 'hr', 'vendor', 'client', 'guest']
    },
    accessModules: {
      type: [String],
      default: [],
    }
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
