import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';

export const getDashboard = async () => {
  const totalApplicants = await Applicant.countDocuments({ isDeleted: false });
  
  const holdApplicants = await Applicant.countDocuments({
    status: applicantEnum.HOLD,
    isDeleted: false,
  });
  const pendingApplicants = await Applicant.countDocuments({
    status: applicantEnum.PENDING,
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
  const inProcessApplicants = await Applicant.countDocuments({
    status: applicantEnum.IN_PROCESS,
    isDeleted: false,
  });
  
  return {
    totalApplicants,
    holdApplicants,
    pendingApplicants,
    selectedApplicants,
    rejectedApplicants,
    inProcessApplicants,
  };
};
// dashBoard
export const getApplicantsByMonth = async (month, year) => {

  const startDate = new Date(year, month - 1, 1); // 1st day of the month
  const endDate = new Date(year, month, 0); // Last day of the month

  const weekRanges = [
    { start: new Date(year, month - 1, 1), end: new Date(year, month - 1, 7) },  // Week 1
    { start: new Date(year, month - 1, 8), end: new Date(year, month - 1, 14) }, // Week 2
    { start: new Date(year, month - 1, 15), end: new Date(year, month - 1, 21) }, // Week 3
    { start: new Date(year, month - 1, 22), end: new Date(year, month - 1, 28) }, // Week 3
    { start: new Date(year, month - 1, 29), end: new Date(year, month - 1, 31) }, // Week 3
    // { start: new Date(year, month - 1, 29), end: endDate } // Week 4 (until last day)
  ];

  const totalApplicantsInMonth = await Applicant.countDocuments({createdAt: { $gte: startDate, $lte: endDate }  });

  const weeklyCounts = await Promise.all(
    weekRanges.map(async ({ start, end }) => {
      const count = await Applicant.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const percentage = totalApplicantsInMonth > 0 ? (count / totalApplicantsInMonth) * 100 : 0;
      return { start, end, count, percentage: percentage.toFixed(2) + "%" };
    })
  );

  return { totalApplicantsInMonth, weeklyCounts }; 
};

// import { getDateRange } from "../helpers/commonFunction/moment.js";

// export const getApplicationCount = async (calendarType, customStartDate, customEndDate) => {
//     const { startDate, endDate } = getDateRange(calendarType, customStartDate, customEndDate);

//     return await Applicant.countDocuments({
//         createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//     });
// };