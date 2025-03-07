import applicantEmail from '../models/applicantEmailModel.js';

export const findAllEmails = async () => {
  return await applicantEmail.find().sort({ createdAt: -1 });
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
