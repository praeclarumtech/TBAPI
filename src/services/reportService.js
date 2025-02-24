import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';
import { getDateRange } from "../helpers/commonFunction/moment.js";

export const getApplicationCount = async (calendarType, customStartDate, customEndDate) => {
    const { startDate, endDate } = getDateRange(calendarType, customStartDate, customEndDate);

    let query = {};

    if (!startDate && !endDate) {
        return await Applicant.countDocuments();
    }

    query.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };

    return await Applicant.countDocuments(query);
};


export const getReport = async (calendarType, customStartDate, customEndDate) => {
    const { startDate, endDate } = getDateRange(calendarType, customStartDate, customEndDate);

    let dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
  }

const totalApplicants = await Applicant.countDocuments({ isDeleted: false, ...dateFilter });
  
  const holdApplicants = await Applicant.countDocuments({
    status: applicantEnum.HOLD,
    isDeleted: false,
    ...dateFilter,
  });
  const pendingApplicants = await Applicant.countDocuments({
    status: applicantEnum.PENDING,
    isDeleted: false,
    ...dateFilter,
  });
  const selectedApplicants = await Applicant.countDocuments({
    status: applicantEnum.SELECTED,
    isDeleted: false,
    ...dateFilter,
  });
  const rejectedApplicants = await Applicant.countDocuments({
    status: applicantEnum.REJECTED,
    isDeleted: false,
    ...dateFilter,
  });
  const inProcessApplicants = await Applicant.countDocuments({
    status: applicantEnum.IN_PROCESS,
    isDeleted: false,
    ...dateFilter
  });

  const hrRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.HR_ROUND,
    isDeleted: false,
    ...dateFilter,
  });
  const hrRoundPercentage = totalApplicants
    ? ((hrRoundApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  // const firstInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.FIRST_INTERVIEW,isDeleted: false,...dateFilter});
  // const firstInterviewPercentage = totalApplicants ? (( firstInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  // const secondInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.SECOND_INTERVIEW,isDeleted: false,...dateFilter});
  // const secondterviewPercentage = totalApplicants ? (( secondInterviewApplicants/ totalApplicants) * 100).toFixed(2) : 0;

  const technicalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.TECHNICAL,
    isDeleted: false,
    ...dateFilter,
  });
  const technicalRoundPercentage = totalApplicants
    ? ((technicalRoundApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const finalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.FINAL,
    isDeleted: false,
    ...dateFilter
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
    appliedSkills: applicantEnum.NODE_JS,
    isDeleted: false,
    ...dateFilter,
  });
  const nodeJsApplicantsPercentage = totalApplicants
    ? ((nodeJsApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const reactJsApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.REACT,
    isDeleted: false,
    ...dateFilter,
  });
  const reactJsApplicantsPercentage = totalApplicants
    ? ((reactJsApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const dotNetApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.DOTNET,
    isDeleted: false,
    ...dateFilter,
  });
  const dotNetApplicantsPercentage = totalApplicants
    ? ((dotNetApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const angularApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.ANGULAR,
    isDeleted: false,
    ...dateFilter,
  });
  const angularApplicantsPercentage = totalApplicants
    ? ((angularApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const uiuxApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.UI_UX,
    isDeleted: false,
    ...dateFilter,
  });
  const uiuxApplicantsPercentage = totalApplicants
    ? ((uiuxApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const pythonApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.PYTHON,
    isDeleted: false,
    ...dateFilter,
  });
  const pythonApplicantsPercentage = totalApplicants
    ? ((pythonApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const javaScriptApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.JAVASCRIPT,
    isDeleted: false,
    ...dateFilter,
  });
  const javaScriptApplicantsPercentage = totalApplicants
    ? ((javaScriptApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const javaApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.JAVA,
    isDeleted: false,
    ...dateFilter,
  });
  const javaApplicantsPercentage = totalApplicants
    ? ((javaApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  const cApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.C,
    isDeleted: false,
    ...dateFilter,
  });
  const cApplicantsPercentage = totalApplicants
    ? ((cApplicants / totalApplicants) * 100).toFixed(2)
    : 0;

  return {
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