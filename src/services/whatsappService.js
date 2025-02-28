import WhatsAppGroup from '../models/whatsappGroupModel.js';

export const createWhatsAppGroupsService = async (group_name, applicant_id, user_id) => {

  const existingGroup = await WhatsAppGroup.findOne({ group_name });
  if (existingGroup) {
    throw new Error("Group name already exists.");
  }

  const newGroup = new WhatsAppGroup({
    group_name,
    applicant_id,
    user_id,
  });
 
  await newGroup.save();
  return newGroup;
};

export const getAllWhatsAppGroupsService = async () => {
  return await WhatsAppGroup.aggregate([
    {
      $match: { is_deleted: false } 
    },
    {
      $lookup: {
        from: "applicants",
        localField: "applicant_id",
        foreignField: "_id",
        as: "applicant_details"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_details"
      }
    },
    {
      $project: {
        _id: 1,
        group_name: 1,
        applicant_details: { _id: 1, name: 1, email: 1, appliedSkills: 1 }, 
        user_details: { _id: 1, name: 1, email: 1 }, 
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);
};
