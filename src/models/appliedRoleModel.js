import mongoose from 'mongoose';

const appliedRoleSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    appliedRole: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const appliedRoleModel = mongoose.model('appliedRoleModel', appliedRoleSchema);
export default appliedRoleModel;
