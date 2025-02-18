import Applicant from "../models/applicantModel.js";
import { applicantEnum } from "../utils/enum.js";

export const getDashboard = async () => {

  const totalApplicants = await Applicant.countDocuments({ isDeleted: false });
  const holdApplicants = await Applicant.countDocuments({status: applicantEnum.HOLD ,isDeleted: false,});
  const pendingApplicants = await Applicant.countDocuments({status: applicantEnum.PENDING,isDeleted: false,});
  const selectedApplicants = await Applicant.countDocuments({status: applicantEnum.SELECTED,isDeleted: false,});
  const rejectedApplicants = await Applicant.countDocuments({status: applicantEnum.REJECTED,isDeleted: false,});
  const inProcessApplicants = await Applicant.countDocuments({status: applicantEnum.IN_PROCESS,isDeleted: false,});

  const hrRoundApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.HR_ROUND,isDeleted: false,});
  const hrRoundPercentage = totalApplicants ? ((hrRoundApplicants / totalApplicants) * 100).toFixed(2) : 0;

  const firstInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.FIRST_INTERVIEW,isDeleted: false,});
  const firstInterviewPercentage = totalApplicants ? (( firstInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  const secondInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.SECOND_INTERVIEW,isDeleted: false,});
  const secondterviewPercentage = totalApplicants ? (( secondInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  const technicalRoundApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.TECHNICAL,isDeleted: false,});
  const technicalRoundPercentage = totalApplicants ? (( technicalRoundApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  const finalRoundApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.FINAL,isDeleted: false,});
  const finalRoundPercentage = totalApplicants ? (( finalRoundApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  return { totalApplicants, holdApplicants, pendingApplicants, selectedApplicants, rejectedApplicants, inProcessApplicants, hrRoundPercentage, firstInterviewPercentage, secondterviewPercentage, technicalRoundPercentage, finalRoundPercentage};
};