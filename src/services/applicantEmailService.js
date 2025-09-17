import applicantEmail from '../models/applicantEmailModel.js';
import mongoose from 'mongoose';


export const findAllEmails = async (query, applicantQuery, page, limit) => {
  const skip = (page - 1) * limit;

  const emails = await applicantEmail.aggregate([
    { $match: query },
    { $unwind: '$email_to' },
    {
      $lookup: {
        from: 'applicants',
        localField: 'email_to',
        foreignField: 'email',
        as: 'applicantDetails',
      },
    },
    {
      $unwind: { path: '$applicantDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $match: applicantQuery,
    },
    {
      $project: {
        email_to: 1,
        email_bcc: 1,
        subject: 1,
        description: 1,
        attachments: 1,
        createdAt: 1,
        'applicantDetails.name': { $ifNull: ['$applicantDetails.name', ''] },
        'applicantDetails.appliedSkills': {
          $ifNull: ['$applicantDetails.appliedSkills', []],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const totalRecords = await applicantEmail.countDocuments(query);
  return { emails, totalRecords, totalPages: Math.ceil(totalRecords / limit) };
};

export const findEmailById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const email = await applicantEmail.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $unwind: '$email_to' },
    {
      $lookup: {
        from: 'applicants',
        localField: 'email_to',
        foreignField: 'email',
        as: 'applicantDetails',
      },
    },
    {
      $unwind: {
        path: '$applicantDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        email_to: 1,
        email_bcc: 1,
        subject: 1,
        description: 1,
        attachments: 1,
        createdAt: 1,
        'applicantDetails.name': { $ifNull: ['$applicantDetails.name', ' '] },
        'applicantDetails.appliedSkills': { $ifNull: ['$applicantDetails.appliedSkills', []] },
      },
    },
  ]);
  return email.length > 0 ? email[0] : null;
};

export const removeManyEmails = async (ids) => {
  return await applicantEmail.deleteMany({ _id: { $in: ids } });
};

export const createEmail = async (emailRecords) => {
  try {
    if (!Array.isArray(emailRecords)) {
      emailRecords = [emailRecords];
    }
    const insertedEmails = await applicantEmail.insertMany(emailRecords);
    return insertedEmails;
  } catch (error) {
    throw error;
  }
};


export const countEmailsByDate = async (start, end) => {
  const emails = await applicantEmail.find({
    createdAt: { $gte: start, $lte: end },
  }, {
    email_to: 1,
    email_bcc: 1
  });

  let total = 0;

  emails.forEach(email => {
    total += (email.email_to?.length || 0) + (email.email_bcc?.length || 0);
  });

  return total;
};
