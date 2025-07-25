import mongoose from 'mongoose';
import Applicant from '../models/applicantModel.js';
import jobApplication from '../models/jobApplicantionModel.js';
import { applicantEnum, Enum } from '../utils/enum.js';

export const getDashboardCounts = async (role, userId) => {
  const Model = (role === Enum.VENDOR || role === Enum.CLIENT) ? jobApplication : Applicant;

  const matchCondition = { isDeleted: false };

  if (role === Enum.VENDOR || role === Enum.CLIENT) {
    matchCondition.vendor_id = new mongoose.Types.ObjectId(userId);
  }

  const statusCounts = await Model.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const defaultCounts = {
    totalApplicants: 0,
    appliedApplicants: 0,
    holdApplicants: 0,
    selectedApplicants: 0,
    rejectedApplicants: 0,
    inProgressApplicants: 0,
    shortListedApplicants: 0,
    onboardedApplicants: 0,
    leavedApplicants: 0
  };

  statusCounts.forEach(stat => {
    defaultCounts.totalApplicants += stat.count;
    switch (stat._id) {
      case applicantEnum.APPLIED:
        defaultCounts.appliedApplicants = stat.count;
        break;
      case applicantEnum.ON_HOLD:
        defaultCounts.holdApplicants = stat.count;
        break;
      case applicantEnum.SELECTED:
        defaultCounts.selectedApplicants = stat.count;
        break;
      case applicantEnum.REJECTED:
        defaultCounts.rejectedApplicants = stat.count;
        break;
      case applicantEnum.IN_PROGRESS:
        defaultCounts.inProgressApplicants = stat.count;
        break;
      case applicantEnum.SHORTLISTED:
        defaultCounts.shortListedApplicants = stat.count;
        break;
      case applicantEnum.ONBOARDED:
        defaultCounts.onboardedApplicants = stat.count;
        break;
      case applicantEnum.LEAVED:
        defaultCounts.leavedApplicants = stat.count;
        break;
    }
  });

  return defaultCounts;
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
