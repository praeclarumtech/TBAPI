import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      enum: ["admin", "hr", "vendor", "client", "guest"]
    },
    accessModules: [
      {
        moduleName: { type: String, required: true },
        permissions: [{ type: String, enum: ["view", "create", "update", "delete"] }]
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
