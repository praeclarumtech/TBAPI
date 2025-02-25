import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';
import { getDateRange } from '../helpers/commonFunction/moment.js';

export const getApplicationCount = async (
  calendarType,
  customStartDate,
  customEndDate
) => {
  const { startDate, endDate } = getDateRange(
    calendarType,
    customStartDate,
    customEndDate
  );

  let query = {};

  if (!startDate && !endDate) {
    return await Applicant.countDocuments();
  }

  query.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };

  return await Applicant.countDocuments(query);
};

export const getReport = async (
  calendarType,
  customStartDate,
  customEndDate
) => {
  const { startDate, endDate } = getDateRange(
    calendarType,
    customStartDate,
    customEndDate
  );

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
  }

  const totalApplicants = await Applicant.countDocuments({
    isDeleted: false,
    ...dateFilter,
  });

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
    ...dateFilter,
  });

  const hrRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.HR_ROUND,
    isDeleted: false,
    ...dateFilter,
  });

  // const firstInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.FIRST_INTERVIEW,isDeleted: false,...dateFilter});

  // const secondInterviewApplicants = await Applicant.countDocuments({interviewStage: applicantEnum.SECOND_INTERVIEW,isDeleted: false,...dateFilter});

  const technicalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.TECHNICAL,
    isDeleted: false,
    ...dateFilter,
  });

  const finalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.FINAL,
    isDeleted: false,
    ...dateFilter,
  });

  const nodeJsApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.NODE_JS,
    isDeleted: false,
    ...dateFilter,
  });

  const reactJsApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.REACT,
    isDeleted: false,
    ...dateFilter,
  });

  const dotNetApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.DOTNET,
    isDeleted: false,
    ...dateFilter,
  });

  const angularApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.ANGULAR,
    isDeleted: false,
    ...dateFilter,
  });

  const uiuxApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.UI_UX,
    isDeleted: false,
    ...dateFilter,
  });

  const pythonApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.PYTHON,
    isDeleted: false,
    ...dateFilter,
  });

  const javaScriptApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.JAVASCRIPT,
    isDeleted: false,
    ...dateFilter,
  });

  const javaApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.JAVA,
    isDeleted: false,
    ...dateFilter,
  });

  const cApplicants = await Applicant.countDocuments({
    appliedSkills: applicantEnum.C,
    isDeleted: false,
    ...dateFilter,
  });

  return {
    hrRoundApplicants,
    // firstInterviewApplicants,
    // secondInterviewApplicants,
    technicalRoundApplicants,
    finalRoundApplicants,

    holdApplicants,
    pendingApplicants,
    selectedApplicants,
    rejectedApplicants,
    inProcessApplicants,

    nodeJsApplicants,
    reactJsApplicants,
    dotNetApplicants,
    angularApplicants,
    uiuxApplicants,
    pythonApplicants,
    javaScriptApplicants,
    javaApplicants,
    cApplicants,
  };
};
