import smsGroup from '../models/groupModel.js';
import { sendSMS } from "../helpers/smsService.js";

export const createSmsGroupsService = async (group_name, applicant_id, user_id) => {

  const existingGroup = await smsGroup.findOne({ group_name });
  if (existingGroup) {
    throw new Error("Group name already exists.");
  }

  const newGroup = new smsGroup({
    group_name,
    applicant_id,
    user_id,
  });
 
  await newGroup.save();
  return newGroup;
};

export const getAllSmsGroupsService = async () => {
  return await smsGroup.aggregate([
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
        "applicant_details._id": 1,
        "applicant_details.name": 1,
        "applicant_details.email": 1,
        "applicant_details.appliedSkills": 1,
        "applicant_details.phone.phoneNumber": 1,
        "user_details._id": 1,
        "user_details.name": 1,
        "user_details.email": 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);
};

export const sendSMSToGroupMembersService = async (groupId, message) => {
  const group = await smsGroup.findById(groupId)
    .populate({
      path: "applicant_id",
      select: "name email phone.phoneNumber",
    })
    .exec();

  if (!group) throw new Error("Group not found.");

  const phoneNumbers = group.applicant_id
    .map((applicant) => applicant.phone?.phoneNumber)
    .filter(Boolean);

  if (phoneNumbers.length === 0) throw new Error("No valid phone numbers found.");

  await sendSMS(phoneNumbers, message);
  return { message: "SMS sent to all group members!" };
};



