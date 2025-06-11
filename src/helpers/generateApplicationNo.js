import Applicant from '../models/applicantModel.js';


export const generateApplicantNo = async () => {
  const lastApplicant = await Applicant.findOne().sort({ applicationNo: -1 })
  return lastApplicant ? lastApplicant.applicationNo + 1 : 1001;
};
