import Applicant from '../models/applicantModel.js';
import { applicantEnum } from '../utils/enum.js';
import { getDateRange } from '../helpers/commonFunction/moment.js';
import moment from 'moment';
import Skills from '../models/skillsModel.js';
import city from '../models/citymodel.js';
import states from '../models/stateModel.js';
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

export const getApplicantSkillCounts = async (skillIds = []) => {
  try {
    let skillCounts = [];

    let skills = [];

    if (skillIds.length > 0) {
      skills = await Skills.find({
        _id: { $in: skillIds },
        isDeleted: false,
      });
    } else {
      const skillCountsAggregation = await Applicant.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: '$appliedSkills' },
        {
          $group: {
            _id: '$appliedSkills',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 16 },
      ]);

      const skillNames = skillCountsAggregation.map((item) => item._id);
      skills = await Skills.find({
        $and: [
          {
            $or: skillNames.map((name) => ({
              skills: { $regex: new RegExp(`^${name}$`, 'i') },
            })),
          },
          { isDeleted: false },
        ],
      });
    }
    skillCounts = await Promise.all(
      skills.map(async (skillDoc) => {
        const skillName = skillDoc.skills;
        const escapedSkill = skillName.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          '\\$&'
        );
        const count = await Applicant.countDocuments({
          appliedSkills: { $regex: new RegExp(`^${escapedSkill}$`, 'i') },
          isDeleted: false,
        });
        return { skill: skillName, count };
      })
    );

    skillCounts.sort((a, b) => b.count - a.count);
    return skillCounts.reduce((acc, { skill, count }) => {
      acc[skill] = count;
      return acc;
    }, {});
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} count applicants by skills: ${error.message}`
    );
    return {};
  }
};

export const getApplicantCountCityAndState = async (type = 'city') => {
  try {
    const result = {};

    if (type === 'city') {
      const cities = await city.find({ isDeleted: { $ne: true } }).lean();

      await Promise.all(
        cities.map(async (cityDoc) => {
          const cityName = cityDoc.city_name;
          const escapedCity = cityName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

          const count = await Applicant.countDocuments({
            currentCity: { $regex: new RegExp(`^${escapedCity}$`, 'i') },
            isDeleted: false,
          });

          if (count > 0) {
            result[cityName] = count;
          }
        })
      );
    } else if (type === 'state') {
      const state = await states.find({ isDeleted: { $ne: true } }).lean();

      await Promise.all(
        state.map(async (stateDoc) => {
          const stateName = stateDoc.state_name;
          const escapedState = stateName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

          const count = await Applicant.countDocuments({
            state: { $regex: new RegExp(`^${escapedState}$`, 'i') },
            isDeleted: false,
          });

          if (count > 0) {
            result[stateName] = count;
          }
        })
      );
    }

    return result;
  } catch (error) {
    logger.error(`${Message.FAILED_TO} count applicants by ${type}: ${error.message}`);
    throw error;
  }
};


export const getApplicantCountByAddedBy = async (startDate, endDate) => {
  try {
    const query = { isDeleted: false };

    if (startDate && endDate) {

      const hasTime = startDate.includes(':') && endDate.includes(':');

      const start = hasTime
        ? moment(startDate, 'DD-MM-YYYY HH:mm').startOf('minute').toDate()
        : moment(startDate, 'DD-MM-YYYY').startOf('day').toDate();

      const end = hasTime
        ? moment(endDate, 'DD-MM-YYYY HH:mm').endOf('minute').toDate()
        : moment(endDate, 'DD-MM-YYYY').endOf('day').toDate();
   
      query.createdAt = { $gte: start, $lte: end };
    }

    const result = await Applicant.aggregate([
      {
        $match: {
          ...query,
          addedBy: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$addedBy',
          count: { $sum: 1 },
        },
      },
    ]);

    const formatted = result.reduce((acc, curr) => {
      if (curr._id) {
        acc[curr._id] = curr.count;
      }
      return acc;
    }, {});

    return formatted;
  } catch (error) {
    logger.error(`Failed to fetch applicant count by addedBy: ${error.message}`);
    throw error;
  }
};


