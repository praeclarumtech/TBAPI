import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';

export const getDashboard = async () => {
  const totalApplicants = await Applicant.countDocuments({ isDeleted: false });

  const holdApplicants = await Applicant.countDocuments({
    status: applicantEnum.ON_HOLD,
    isDeleted: false,
  });
  const appliedApplicants = await Applicant.countDocuments({
    status: applicantEnum.APPLIED,
    isDeleted: false,
  });
  const selectedApplicants = await Applicant.countDocuments({
    status: applicantEnum.SELECTED,
    isDeleted: false,
  });
  const rejectedApplicants = await Applicant.countDocuments({
    status: applicantEnum.REJECTED,
    isDeleted: false,
  });
  const inProgressApplicants = await Applicant.countDocuments({
    status: applicantEnum.IN_PROGRESS,
    isDeleted: false,
  });
  const shortListedApplicants = await Applicant.countDocuments({
    status: applicantEnum.SHORTLISTED,
    isDeleted: false,
  });
  const onboardedApplicants = await Applicant.countDocuments({
    status: applicantEnum.ONBOARDED,
    isDeleted: false,
  });
  const leavedApplicants = await Applicant.countDocuments({
    status: applicantEnum.LEAVED,
    isDeleted: false,
  });

  return {
    totalApplicants,
    holdApplicants,
    appliedApplicants,
    selectedApplicants,
    rejectedApplicants,
    inProgressApplicants,
    shortListedApplicants,
    onboardedApplicants,
    leavedApplicants,
  };
};

export const getApplicantsByMonth = async (month, year) => {
  const currentDate = new Date();
  const selectedMonth = month ? Number(month) : currentDate.getMonth() + 1;
  const selectedYear = year ? Number(year) : currentDate.getFullYear();

  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const totalApplicantsInMonth = await Applicant.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const totalApplicants = await Applicant.countDocuments();

  const percentage = totalApplicants
    ? ((totalApplicantsInMonth / totalApplicants) * 100).toFixed(2)
    : 0;

  return { totalApplicantsInMonth, percentage };
};
