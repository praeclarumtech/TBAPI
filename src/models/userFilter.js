import mongoose from "mongoose";

const userFilterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filters: {
      type: Object, // dynamic JSON { gender: "male", role: "QA" }
      default: {},
    },
  },
  { timestamps: true }
);

const UserFilter = mongoose.model("UserFilter", userFilterSchema);
export default UserFilter;
