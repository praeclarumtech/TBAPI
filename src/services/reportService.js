import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';
import { getDateRange } from '../helpers/commonFunction/moment.js';
import Skills from '../models/skillsModel.js';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';

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

  const firstInterviewRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.FIRST_INTERVIEW_ROUND,
    isDeleted: false,
    ...dateFilter,
  });

  const clientInterviewApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.CLIENT,
    isDeleted: false,
    ...dateFilter,
  });

  const technicalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.TECHNICAL,
    isDeleted: false,
    ...dateFilter,
  });

  const practicalRoundApplicants = await Applicant.countDocuments({
    interviewStage: applicantEnum.PRACTICAL,
    isDeleted: false,
    ...dateFilter,
  });

  return {
    hrRoundApplicants,
    firstInterviewRoundApplicants,
    clientInterviewApplicants,
    technicalRoundApplicants,
    practicalRoundApplicants,

    holdApplicants,
    pendingApplicants,
    selectedApplicants,
    rejectedApplicants,
    inProcessApplicants,

  };
};

export const getCategoryWiseSkillCount = async (category) => {
  try {
    if (!category) {
      return { message: "Category is required", skillCounts: {} };
    }

    const skills = await Skills.find({ category, isDeleted: false }).select("skills");

    if (!skills.length) {
      return { message: "No skills found for this category", skillCounts: {} };
    }

    const skillNames = skills.map(skill => skill.skills);

    const skillCounts = await Promise.all(
      skillNames.map(async (skill) => {
        const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        const count = await Applicant.countDocuments({
          appliedSkills: { $regex: new RegExp(`^${escapedSkill}$`, "i") },
          isDeleted: false,
        });

        return { skill, count };
      })
    );

    return {
      skillCounts: skillCounts.reduce((acc, { skill, count }) => {
        acc[skill] = count;
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error(`Failed to fetch category-wise skill count: ${error.message}`);
    return { skillCounts: {} };
  }
};


