import Applicant from '../models/applicantModel.js';
import { applicantEnum, Enum } from '../utils/enum.js';
import { getDateRange } from '../helpers/commonFunction/moment.js';
import moment from 'moment';
import Skills from '../models/skillsModel.js';
import city from '../models/citymodel.js';
import states from '../models/stateModel.js';
import Designations from '../models/designationModel.js';
import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import jobApplication from '../models/jobApplicantionModel.js';
import mongoose from 'mongoose';
import jobs from '../models/jobModel.js';
import { TOO_MANY_REQUESTS } from 'http-status-codes';

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

export const getInterviewStageCount = async (
  calendarType,
  customStartDate,
  customEndDate,
  role,
  userId
) => {
  try {
    const { startDate, endDate } = getDateRange(
      calendarType,
      customStartDate,
      customEndDate
    );
    const model =
      role === Enum.VENDOR || role === Enum.CLIENT ? jobApplication : Applicant;

    const matchCondition = { isDeleted: false, isActive: true };
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      };
    }
    if (role === Enum.VENDOR || role === Enum.CLIENT) {
      matchCondition.vendor_id = new mongoose.Types.ObjectId(userId);
    }

    const statusCounts = await model.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$interviewStage',
          count: { $sum: 1 },
        },
      },
    ]);

    const defaultCounts = {
      hrRoundApplicants: 0,
      firstInterviewRoundApplicants: 0,
      clientInterviewApplicants: 0,
      technicalRoundApplicants: 0,
      practicalRoundApplicants: 0,
    };

    statusCounts.forEach((stat) => {
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
    logger.error(
      `${Message.FAILED_TO} count interview stage: ${error.message}`
    );
    throw error;
  }
};

export const getApplicantSkillCounts = async (skillIds = [], user) => {
  try {
    let skillCounts = [];
    let skills = [];

    const isVendor = user?.role === Enum.VENDOR;
    const isClient = user?.role === Enum.CLIENT;

    // For CLIENT: Get skills from Applicant table for applicants who applied to client's jobs
    // For VENDOR: Use jobApplication table directly
    // For ADMIN/HR: Use Applicant table directly (all applicants)

    // VENDOR uses jobApplication, CLIENT and others use Applicant
    const model = isVendor ? jobApplication : Applicant;

    // For CLIENT: Get job IDs for client's jobs
    let clientJobIds = [];
    if (isClient) {
      const clientId = new mongoose.Types.ObjectId(user.id);
      const clientJobs = await jobs
        .find({ addedBy: clientId, isDeleted: false }, '_id')
        .lean();
      clientJobIds = clientJobs.map((job) => job._id);
    }

    if (skillIds.length > 0) {
      skills = await Skills.find({
        _id: { $in: skillIds },
        isDeleted: false,
      });
    } else {
      let skillCountsAggregation;

      if (isClient && clientJobIds.length > 0) {
        // Debug: Count total job applications for client's jobs
        const totalApplications = await jobApplication.countDocuments({
          job_id: { $in: clientJobIds },
          isDeleted: false,
        });
        console.log('Total job applications for client:', totalApplications);

        // Debug: Check how many have matching Applicant records (case-insensitive)
        const withApplicantData = await jobApplication.aggregate([
          { $match: { job_id: { $in: clientJobIds }, isDeleted: false } },
          { $addFields: { emailLower: { $toLower: '$email' } } },
          {
            $lookup: {
              from: 'applicants',
              let: { appEmail: '$emailLower' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: [{ $toLower: '$email' }, '$$appEmail'] },
                  },
                },
              ],
              as: 'applicantData',
            },
          },
          { $match: { 'applicantData.0': { $exists: true } } },
          { $count: 'withApplicant' },
        ]);
        console.log(
          'Applications with matching Applicant (case-insensitive):',
          withApplicantData[0]?.withApplicant || 0
        );

        // Debug: Check how many applicants have skills
        const withSkills = await jobApplication.aggregate([
          { $match: { job_id: { $in: clientJobIds }, isDeleted: false } },
          { $addFields: { emailLower: { $toLower: '$email' } } },
          {
            $lookup: {
              from: 'applicants',
              let: { appEmail: '$emailLower' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: [{ $toLower: '$email' }, '$$appEmail'] },
                  },
                },
              ],
              as: 'applicantData',
            },
          },
          { $unwind: '$applicantData' },
          { $match: { 'applicantData.appliedSkills.0': { $exists: true } } },
          { $count: 'withSkills' },
        ]);
        console.log(
          'Applications with Applicant having skills:',
          withSkills[0]?.withSkills || 0
        );

        // For CLIENT: Join jobApplication with Applicant to get skills
        // Using pipeline $lookup for case-insensitive email matching
        skillCountsAggregation = await jobApplication.aggregate([
          // Match job applications for client's jobs
          { $match: { job_id: { $in: clientJobIds }, isDeleted: false } },
          // Normalize email to lowercase for matching
          { $addFields: { emailLower: { $toLower: '$email' } } },
          // Lookup applicant data by email (case-insensitive)
          {
            $lookup: {
              from: 'applicants',
              let: { appEmail: '$emailLower' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toLower: '$email' }, '$$appEmail'],
                    },
                  },
                },
              ],
              as: 'applicantData',
            },
          },
          { $unwind: '$applicantData' },
          // Unwind the appliedSkills from Applicant
          { $unwind: '$applicantData.appliedSkills' },
          {
            $group: {
              _id: '$applicantData.appliedSkills',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 16 },
        ]);
      } else {
        // For VENDOR and ADMIN/HR
        const matchCondition = { isDeleted: false, isActive: true };
        if (isVendor) {
          matchCondition.vendor_id = new mongoose.Types.ObjectId(user.id);
        }

        skillCountsAggregation = await model.aggregate([
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
      }

      const skillNames = skillCountsAggregation.map((item) => item._id);
      if (skillNames.length > 0) {
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
    }

    skillCounts = await Promise.all(
      skills.map(async (skillDoc) => {
        const skillName = skillDoc.skills;
        const escapedSkill = skillName.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          '\\$&'
        );

        let count;
        if (isClient && clientJobIds.length > 0) {
          // For CLIENT: Count using $lookup with Applicant (case-insensitive email)
          const result = await jobApplication.aggregate([
            { $match: { job_id: { $in: clientJobIds }, isDeleted: false } },
            { $addFields: { emailLower: { $toLower: '$email' } } },
            {
              $lookup: {
                from: 'applicants',
                let: { appEmail: '$emailLower' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: [{ $toLower: '$email' }, '$$appEmail'] },
                    },
                  },
                ],
                as: 'applicantData',
              },
            },
            { $unwind: '$applicantData' },
            {
              $match: {
                'applicantData.appliedSkills': {
                  $regex: new RegExp(`^${escapedSkill}$`, 'i'),
                },
              },
            },
            { $count: 'total' },
          ]);
          count = result[0]?.total || 0;
        } else {
          // For VENDOR and ADMIN/HR
          const query = {
            appliedSkills: { $regex: new RegExp(`^${escapedSkill}$`, 'i') },
            isDeleted: false,
          };
          if (isVendor) {
            query.vendor_id = new mongoose.Types.ObjectId(user.id);
          }
          count = await model.countDocuments(query);
        }

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
    const isVendor = user?.role === Enum.VENDOR;
    const isClient = user?.role === Enum.CLIENT;
    const model = isVendor || isClient ? jobApplication : Applicant;
    const matchStage = { isDeleted: false, isActive: true };
    if (isVendor || isClient) {
      matchStage.vendor_id = user.id;
    }

    if (isClient) {
      const jobIds = await jobs.find({ addedBy: user.id }, { _id: 1 }).lean();
      const jobIdList = jobIds.map((job) => job._id);
      matchStage.job_id = { $in: jobIdList };
    }
    const groupField = type === 'city' ? '$currentCity' : '$state';

    const aggregation = [
      { $match: matchStage },
      {
        $group: {
          _id: { $toLower: { $ifNull: [groupField, null] } }, // normalize to lowercase
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ];

    const resultArr = await model.aggregate(aggregation);

    let validNames = [];
    if (type === 'city') {
      validNames = await city
        .find({ isDeleted: { $ne: true } }, 'city_name')
        .lean();
    } else {
      validNames = await states
        .find({ isDeleted: { $ne: true } }, 'state_name')
        .lean();
    }
    const validNameSet = new Set(
      validNames.map((item) =>
        (type === 'city' ? item.city_name : item.state_name).toLowerCase()
      )
    );

    const finalResult = {};
    for (const row of resultArr) {
      if (validNameSet.has(row._id)) {
        // Inline Title Case without helper
        const formattedName = row._id
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        finalResult[formattedName] = row.count;
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

export const getApplicantCountByAddedBy = async (
  startDate,
  endDate,
  currentCompanyDesignation
) => {
  try {
    const query = { isDeleted: false, isActive: true };

    if (startDate || endDate) {
      const start = startDate
        ? moment(startDate, 'DD-MM-YYYY').startOf('day').toDate()
        : new Date('1970-01-01T00:00:00Z');

      const end = endDate
        ? moment(endDate, 'DD-MM-YYYY').endOf('day').toDate()
        : moment().endOf('day').toDate();

      query.createdAt = { $gte: start, $lte: end };
    }

    if (currentCompanyDesignation) {
      const designations = currentCompanyDesignation
        .split(',')
        .map((d) => d.trim());
      query.currentCompanyDesignation = { $in: designations };
    }

    if (currentCompanyDesignation) {
      const count = await Applicant.countDocuments({
        ...query,
        addedBy: { $nin: [null, ''] },
      });
      return count;
    }

    const result = await Applicant.aggregate([
      {
        $match: {
          ...query,
          addedBy: { $ne: [null, ''] },
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

export const getApplicantCountByDesignationCounts = async (
  designation,
  user
) => {
  try {
    const isVendor = user?.role === Enum.VENDOR;
    const model = isVendor ? jobApplication : Applicant;

    // If designations are passed
    if (designation) {
      const designations = designation.split(',').map((d) => d.trim());
      const counts = {};

      for (const des of designations) {
        const regex = new RegExp(`^${des}$`, 'i');

        const count = await model.countDocuments({
          currentCompanyDesignation: { $regex: regex },
          isDeleted: false,
          ...(isVendor && { vendor_id: user.id }),
        });

        counts[des] = count;
      }

      return counts;
    }

    const aggregation = await model.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
          currentCompanyDesignation: { $nin: [null, ''] },
          ...(isVendor && { vendor_id: user.id }),
        },
      },
      {
        $group: {
          _id: '$currentCompanyDesignation',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return aggregation.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  } catch (error) {
    logger.error(
      `${Message.FAILED_TO} count applicants by designation: ${error.message}`
    );
    return {};
  }
};

export const getApplicantByGenderWorkNotice = async (filters) => {
  const {
    gender,
    workPreference,
    noticePeriod,
    createdBy,
    isActive,
    isFavorite,
  } = filters;

  const match = { isActive: true };

  if (gender) {
    match.gender = {
      $in: gender.split(',').map((g) => g.trim().toLowerCase()),
    };
  }
  if (workPreference) {
    match.workPreference = {
      $in: workPreference.split(',').map((w) => w.trim().toLowerCase()),
    };
  }
  if (noticePeriod) {
    match.noticePeriod = {
      $in: noticePeriod.split(',').map((n) => Number(n.trim())),
    };
  }
  if (createdBy) {
    match.createdBy = {
      $in: createdBy.split(',').map((r) => r.trim().toLowerCase()),
    };
  }
  if (isFavorite !== undefined) {
    match.isFavorite = {
      $in: isFavorite.split(',').map((f) => f.trim() === 'true'),
    };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        gender: {
          $push: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$gender', ''] }, ''] },
                  { $eq: ['$gender', ''] },
                ],
              },
              'other',
              { $toLower: '$gender' },
            ],
          },
        },
        workPreference: {
          $push: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$workPreference', ''] }, ''] },
                  { $eq: ['$workPreference', ''] },
                ],
              },
              'other',
              { $toLower: '$workPreference' },
            ],
          },
        },
        noticePeriod: {
          $push: {
            $cond: [
              {
                $or: [
                  { $eq: ['$noticePeriod', ''] }, // empty string
                  { $eq: [{ $ifNull: ['$noticePeriod', ''] }, ''] }, // null or missing
                  { $not: [{ $isNumber: '$noticePeriod' }] }, // not a number
                  { $not: [{ $in: ['$noticePeriod', [15, 30, 60, 90]] }] }, // not a valid number
                ],
              },
              'other',
              '$noticePeriod',
            ],
          },
        },

        createdBy: {
          $push: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$createdBy', ''] }, ''] },
                  { $eq: ['$createdBy', ''] },
                ],
              },
              'other',
              { $toLower: '$createdBy' },
            ],
          },
        },
        isFavorite: {
          $push: {
            $cond: [{ $eq: ['$isFavorite', true] }, true, false],
          },
        },
      },
    },
  ];

  const result = await Applicant.aggregate(pipeline);

  if (!result.length) {
    return null;
  }

  const data = result[0];

  const normalizeValue = (val, type = 'string') => {
    if (type === 'number') {
      if (typeof val === 'number' && !isNaN(val)) return val;
      return 'other';
    }
    if (type === 'boolean') {
      if (typeof val === 'boolean') return val;
      return 'other';
    }
    return val && val.toString().trim()
      ? val.toString().toLowerCase()
      : 'other';
  };

  const countValues = (arr, allOptions, type = 'string') => {
    const counts = {};
    allOptions.forEach((val) => {
      counts[val] = arr.filter((x) => normalizeValue(x, type) === val).length;
    });
    if (!allOptions.includes('other')) {
      const otherCount = arr.filter(
        (x) => normalizeValue(x, type) === 'other'
      ).length;
      if (otherCount > 0) counts['other'] = otherCount;
    }
    return counts;
  };

  const genderOptions = ['male', 'female', 'other'];
  const workPrefOptions = ['onsite', 'remote', 'hybrid', 'other'];
  const noticeOptions = [15, 30, 60, 90, 'other'];
  const roleOptions = ['admin', 'vendor', 'client', 'hr', 'guest', 'other'];

  const [activeCount, inactiveCount] = await Promise.all([
    Applicant.countDocuments({ isActive: true }),
    Applicant.countDocuments({ isActive: false }),
  ]);

  return {
    gender: gender
      ? countValues(
          data.gender,
          gender.split(',').map((g) => g.trim().toLowerCase())
        )
      : countValues(data.gender, genderOptions),

    workPreference: workPreference
      ? countValues(
          data.workPreference,
          workPreference.split(',').map((w) => w.trim().toLowerCase())
        )
      : countValues(data.workPreference, workPrefOptions),

    noticePeriod: noticePeriod
      ? countValues(
          data.noticePeriod,
          noticePeriod.split(',').map((n) => Number(n.trim())),
          'number'
        )
      : countValues(data.noticePeriod, noticeOptions, 'number'),

    role: createdBy
      ? countValues(
          data.createdBy,
          createdBy.split(',').map((r) => r.trim().toLowerCase())
        )
      : countValues(data.createdBy, roleOptions),

    active: { true: activeCount, false: inactiveCount },

    favorite: isFavorite
      ? countValues(
          data.isFavorite,
          isFavorite.split(',').map((f) => f.trim() === 'true'),
          'boolean'
        )
      : countValues(data.isFavorite, [true, false], 'boolean'),
  };
};
