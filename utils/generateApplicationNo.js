const Applicant = require("../models/Applicant");

const generateApplicantNo = async () => {
  const lastApplicant = await Applicant.findOne().sort({ application_No: -1 });
  return lastApplicant ? lastApplicant.application_No + 1 : 1001;
};

module.exports = generateApplicantNo;
