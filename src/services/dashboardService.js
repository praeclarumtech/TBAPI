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

  const hrRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.HR_ROUND,
    isDeleted: false,
  });
  const hrRoundPercentage = totalApplicants
    ? ((hrRoundApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  // const firstInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.FIRST_INTERVIEW,isDeleted: false,});
  // const firstInterviewPercentage = totalApplicants ? (( firstInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  // const secondInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.SECOND_INTERVIEW,isDeleted: false,});
  // const secondterviewPercentage = totalApplicants ? (( secondInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  const technicalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.TECHNICAL,
    isDeleted: false,
  });
  const technicalRoundPercentage = totalApplicants
    ? ((technicalRoundApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const finalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.FINAL,
    isDeleted: false,
  });
  const finalRoundPercentage = totalApplicants
    ? ((finalRoundApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const holdApplicantsPercentage = totalApplicants
    ? ((holdApplicants / totalApplicants) * 100).toFixed(2)
    : 0;
  const pendingApplicantsPercentage = totalApplicants
    ? ((pendingApplicants / totalApplicants) * 100).toFixed(2)
    : 0;
  const selectedApplicantsPercentage = totalApplicants
    ? ((selectedApplicants / totalApplicants) * 100).toFixed(2)
    : 0;
  const rejectedApplicantsPercentage = totalApplicants
    ? ((rejectedApplicants / totalApplicants) * 100).toFixed(2)
    : 0;
  const inProcessApplicantsPercentage = totalApplicants
    ? ((inProcessApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const nodeJsApplicants = await Applicant.countDocuments({
    appliedSkills: 'Node.js',
    isDeleted: false,
  });
  const nodeJsApplicantsPercentage = totalApplicants
    ? ((nodeJsApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const reactJsApplicants = await Applicant.countDocuments({
    appliedSkills: 'React',
    isDeleted: false,
  });
  const reactJsApplicantsPercentage = totalApplicants
    ? ((reactJsApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const dotNetApplicants = await Applicant.countDocuments({
    appliedSkills: 'DotNet',
    isDeleted: false,
  });
  const dotNetApplicantsPercentage = totalApplicants
    ? ((dotNetApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const angularApplicants = await Applicant.countDocuments({
    appliedSkills: 'Angular',
    isDeleted: false,
  });
  const angularApplicantsPercentage = totalApplicants
    ? ((angularApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const uiuxApplicants = await Applicant.countDocuments({
    appliedSkills: 'UI UX',
    isDeleted: false,
  });
  const uiuxApplicantsPercentage = totalApplicants
    ? ((uiuxApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const pythonApplicants = await Applicant.countDocuments({
    appliedSkills: 'Python',
    isDeleted: false,
  });
  const pythonApplicantsPercentage = totalApplicants
    ? ((pythonApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const javaScriptApplicants = await Applicant.countDocuments({
    appliedSkills: 'JavaScript',
    isDeleted: false,
  });
  const javaScriptApplicantsPercentage = totalApplicants
    ? ((javaScriptApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const javaApplicants = await Applicant.countDocuments({
    appliedSkills: 'Java',
    isDeleted: false,
  });
  const javaApplicantsPercentage = totalApplicants
    ? ((javaApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const cApplicants = await Applicant.countDocuments({
    appliedSkills: 'C++',
    isDeleted: false,
  });
  const cApplicantsPercentage = totalApplicants
    ? ((cApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  return {
    totalApplicants,
    holdApplicants,
    pendingApplicants,
    selectedApplicants,
    rejectedApplicants,
    inProcessApplicants,
    hrRoundPercentage,
    // firstInterviewPercentage,
    // secondterviewPercentage,
    technicalRoundPercentage,
    finalRoundPercentage,
    holdApplicantsPercentage,
    pendingApplicantsPercentage,
    selectedApplicantsPercentage,
    rejectedApplicantsPercentage,
    inProcessApplicantsPercentage,
    nodeJsApplicantsPercentage,
    reactJsApplicantsPercentage,
    dotNetApplicantsPercentage,
    angularApplicantsPercentage,
    uiuxApplicantsPercentage,
    pythonApplicantsPercentage,
    javaScriptApplicantsPercentage,
    javaApplicantsPercentage,
    cApplicantsPercentage,
  };
}; 

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
