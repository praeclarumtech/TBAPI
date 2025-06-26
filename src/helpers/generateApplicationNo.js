import Applicant from '../models/applicantModel.js';
import jobs from '../models/jobModel.js'


export const generateApplicantNo = async () => {
  const lastApplicant = await Applicant.findOne().sort({ applicationNo: -1 })
  return lastApplicant ? lastApplicant.applicationNo + 1 : 1001;
};

export const generateJobId = async () => {
  const lastJobId = await jobs.findOne().sort({ job_id: -1 }).lean();
  const lastNumber = lastJobId?.job_id?.match(/^PT(\d{4})/)?.[1] || '0000';
  const nextNumber = String(parseInt(lastNumber, 10) + 1).padStart(4, '0');
  return `PT${nextNumber}`;
};