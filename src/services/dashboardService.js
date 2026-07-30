import mongoose from 'mongoose';
import Applicant from '../models/applicantModel.js';
import jobApplication from '../models/jobApplicantionModel.js';
import jobs from '../models/jobModel.js';
import { applicantEnum, Enum } from '../utils/enum.js';

const getDashboardApplicantScope = async (role, userId) => {
  const Model =
    role === Enum.VENDOR || role === Enum.CLIENT ? jobApplication : Applicant;

  // For VENDOR and CLIENT roles, only filter by isDeleted to include all applications
  // This is consistent with getClientDashboard and viewJobApplicantionsByVendor
  const matchCondition =
    role === Enum.VENDOR || role === Enum.CLIENT
      ? { isDeleted: false }
      : { isDeleted: false, isActive: true };

  if (role === Enum.VENDOR) {
    // Vendor can see applications for:
    // 1. Jobs they created (addedBy)
    // 2. Jobs they were emailed about (emailedVendors)
    // 3. Applications they submitted (vendor_id)
    const vendorId = new mongoose.Types.ObjectId(userId);

    // Get job IDs for jobs vendor created or was emailed about
    const vendorJobs = await jobs
      .find(
        {
          $or: [{ addedBy: vendorId }, { emailedVendors: vendorId }],
          isDeleted: false,
        },
        '_id'
      )
      .lean();

    const jobIds = vendorJobs.map((job) => job._id);

    matchCondition.$or = [{ vendor_id: vendorId }, { job_id: { $in: jobIds } }];
  } else if (role === Enum.CLIENT) {
    // Client can only see applications for jobs they created
    const clientId = new mongoose.Types.ObjectId(userId);

    const clientJobs = await jobs
      .find(
        {
          addedBy: clientId,
          isDeleted: false,
        },
        '_id'
      )
      .lean();

    const jobIds = clientJobs.map((job) => job._id);
    matchCondition.job_id = { $in: jobIds };
  }

  return { Model, matchCondition };
};

export const getDashboardCounts = async (role, userId) => {
  const { Model, matchCondition } = await getDashboardApplicantScope(role, userId);

  const statusCounts = await Model.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
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
    leavedApplicants: 0,
  };

  statusCounts.forEach((stat) => {
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

export const getApplicantAppliedChartCounts = async (role, userId) => {
  const { Model, matchCondition } = await getDashboardApplicantScope(role, userId);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfDayBeforeYesterday = new Date(startOfToday);
  startOfDayBeforeYesterday.setDate(startOfDayBeforeYesterday.getDate() - 2);

  const startOfTwoDaysBeforeYesterday = new Date(startOfToday);
  startOfTwoDaysBeforeYesterday.setDate(
    startOfTwoDaysBeforeYesterday.getDate() - 3
  );

  const startOfLast7Days = new Date(startOfToday);
  startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);

  const startOfLast30Days = new Date(startOfToday);
  startOfLast30Days.setDate(startOfLast30Days.getDate() - 29);

  const startOfLast365Days = new Date(startOfToday);
  startOfLast365Days.setDate(startOfLast365Days.getDate() - 364);

  const ranges = [
    { key: 'today', label: 'Today', from: startOfToday },
    {
      key: 'yesterday',
      label: 'Yesterday',
      from: startOfYesterday,
      to: startOfToday,
    },
    {
      key: 'dayBeforeYesterday',
      label: 'Day Before Yesterday',
      from: startOfDayBeforeYesterday,
      to: startOfYesterday,
    },
    {
      key: 'twoDaysBeforeYesterday',
      label: '2 Days Before Yesterday',
      from: startOfTwoDaysBeforeYesterday,
      to: startOfDayBeforeYesterday,
    },
    { key: 'last7Days', label: 'Last 7 Days', from: startOfLast7Days },
    { key: 'last30Days', label: 'Last 30 Days', from: startOfLast30Days },
    { key: 'last365Days', label: 'Last 365 Days', from: startOfLast365Days },
  ];

  const counts = await Promise.all(
    ranges.map(async (range) => {
      const createdAtFilter = range.to
        ? { $gte: range.from, $lt: range.to }
        : { $gte: range.from, $lte: now };
      const count = await Model.countDocuments({
        ...matchCondition,
        createdAt: createdAtFilter,
      });

      return {
        key: range.key,
        label: range.label,
        count,
        from: range.from,
        to: range.to || now,
      };
    })
  );

  return counts;
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
