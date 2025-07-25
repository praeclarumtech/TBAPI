import Applicant from '../models/applicantModel.js';
import { applicantEnum, Enum } from '../utils/enum.js';
import { getDateRange } from '../helpers/commonFunction/moment.js';
import moment from 'moment';
import Skills from '../models/skillsModel.js';
import city from '../models/citymodel.js';
import states from '../models/stateModel.js';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import jobApplication from '../models/jobApplicantionModel.js';
import mongoose from 'mongoose';

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

export const getInterviewStageCount = async (calendarType, customStartDate, customEndDate, role, userId) => {
  try {
    const { startDate, endDate } = getDateRange(
      calendarType,
      customStartDate,
      customEndDate
    );
    const model = (role === Enum.VENDOR || role === Enum.CLIENT) ? jobApplication : Applicant;

    const matchCondition = { isDeleted: false };
    if (startDate && endDate) {
      matchCondition.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }
    if (role === Enum.VENDOR || role === Enum.CLIENT) {
      matchCondition.vendor_id = new mongoose.Types.ObjectId(userId);
    }

    const statusCounts = await model.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$interviewStage',
          count: { $sum: 1 }
        }
      }
    ]);

    const defaultCounts = {
      hrRoundApplicants: 0,
      firstInterviewRoundApplicants: 0,
      clientInterviewApplicants: 0,
      technicalRoundApplicants: 0,
      practicalRoundApplicants: 0,
    };

    statusCounts.forEach(stat => {
      switch (stat._id) {
        case applicantEnum.HR_ROUND:
          defaultCounts.hrRoundApplicants = stat.count;
          break;
        case applicantEnum.TECHNICAL:
          defaultCounts.technicalRoundApplicants = stat.count;
          break;
        case applicantEnum.FIRST_INTERVIEW_ROUND:
          defaultCounts.firstInterviewRoundApplicants = stat.count;
          break;
        case applicantEnum.PRACTICAL:
          defaultCounts.practicalRoundApplicants = stat.count;
          break;
        case applicantEnum.CLIENT:
          defaultCounts.clientInterviewApplicants = stat.count;
          break;
      }
    });

    return defaultCounts;

  } catch (error) {
    logger.error(`${Message.FAILED_TO} count interview stage: ${error.message}`);
    throw error;
  }
}

export const getApplicantSkillCounts = async (skillIds = [], user) => {
  try {
    let skillCounts = [];
    let skills = [];

    const isVendor = user?.role === Enum.VENDOR;
    const model = isVendor ? jobApplication : Applicant;

    if (skillIds.length > 0) {
      skills = await Skills.find({
        _id: { $in: skillIds },
        isDeleted: false,
      });
    } else {
      const matchCondition = { isDeleted: false };
      if (isVendor) {
        matchCondition.vendor_id = user.id;
      }
      const skillCountsAggregation = await model.aggregate([
        { $match: matchCondition },
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

        const query = {
          appliedSkills: { $regex: new RegExp(`^${escapedSkill}$`, 'i') },
          isDeleted: false,
        };

        if (isVendor) {
          query.vendor_id = user.id;
        }

        const count = await model.countDocuments(query);
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

export const getApplicantCountCityAndState = async (type = 'city', user) => {
  try {
    console.log("inside =============report ========== service")
    const isVendor = user?.role === Enum.VENDOR;

    const model = isVendor ? jobApplication : Applicant;
    const matchStage = { isDeleted: false };
    if (isVendor) {
      console.log("inside isVendor")
      matchStage.vendor_id = user.id;
      console.log("isVendor", isVendor)
    }

    const groupField = type === 'city' ? '$currentCity' : '$state';
    console.log("groupField>>>>", groupField)

    const aggregation = [
      { $match: matchStage },
      {
        $group: {
          _id: { $ifNull: [groupField, null] },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      }
    ];

    const resultArr = await model.aggregate(aggregation);
    console.log("resultArr", resultArr)

    let validNames = [];
    if (type === 'city') {
      console.log("inside type city")
      validNames = await city.find({ isDeleted: { $ne: true } }, 'city_name').lean();
      console.log("validNames>>>>>>>>>.",validNames)
    } else {
      validNames = await states.find({ isDeleted: { $ne: true } }, 'state_name').lean();
    }
    const validNameSet = new Set(
      validNames.map((item) => (type === 'city' ? item.city_name : item.state_name).toLowerCase())
    );
    console.log("validNames>>>>>>", validNames)
    const finalResult = {};
    for (const row of resultArr) {
      const name = row._id?.trim();
      if (name && validNameSet.has(name.toLowerCase())) {
        finalResult[name] = row.count;
      }
    }

    return finalResult;
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} count applicants by ${type}: ${error.message}`
    );
    throw error;
  }
};


export const getApplicantCountByAddedBy = async (startDate, endDate) => {
  try {
    const query = { isDeleted: false };

    if (startDate || endDate) {
      const start = startDate
        ? moment(startDate, 'DD-MM-YYYY').startOf('day').toDate()
        : new Date('1970-01-01T00:00:00Z');

      const end = endDate
        ? moment(endDate, 'DD-MM-YYYY').endOf('day').toDate()
        : moment().endOf('day').toDate();

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
    logger.error(
      `Failed to fetch applicant count by addedBy: ${error.message}`
    );
    throw error;
  }
};
