import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      lowercase: true, // Normalize role names to lowercase
      // Removed enum constraint to allow custom role names
    },
    accessModules: {
      type: [String],
      required: true,
      default: ['dashboard'],
    },
    status: {
      type:Boolean,
      default:true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);