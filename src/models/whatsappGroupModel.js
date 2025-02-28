import mongoose from "mongoose";

const WhatsAppGroupSchema = new mongoose.Schema(
  {
    group_name: { type: String, required: true, unique: true},
    applicant_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applicant" }],
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true } 
);

const WhatsAppGroup = mongoose.model("WhatsAppGroups", WhatsAppGroupSchema);
export default WhatsAppGroup;

