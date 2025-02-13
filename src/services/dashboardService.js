import Applicant from "../models/applicantModel.js";

export const getDashboard = async () => {
    return Applicant.countDocuments({ isDeleted: false });
  };