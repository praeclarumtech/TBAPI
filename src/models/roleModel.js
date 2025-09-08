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
      required: true,
      default: ['dashboard'],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
