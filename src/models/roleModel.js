import mongoose from 'mongoos';

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