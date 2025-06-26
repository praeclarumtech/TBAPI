import logger from '../loggers/logger.js';
import { Message } from '../utils/constant/message.js';
import {
  getDashboard,
  getApplicantsByMonth,
} from '../services/dashboardService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { getMonthlyApplicantCount } from '../services/dashboardService.js';

export const dashboard = async (req, res) => {
  try {
    const {
      totalApplicants,
      holdApplicants,
      appliedApplicants,
      selectedApplicants,
      rejectedApplicants,
      inProgressApplicants,
      shortListedApplicants,
      onboardedApplicants,
      leavedApplicants,
    } = await getDashboard();

    logger.info(`Dashboard data ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
      {
        totalApplicants,
        holdApplicants,
        appliedApplicants,
        selectedApplicants,
        rejectedApplicants,
        inProgressApplicants,
        shortListedApplicants,
        onboardedApplicants,
        leavedApplicants,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch dashboard data`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      undefined,
      error
    );
  }
};

export const applicantDetails = async (req, res) => {
  try {
    const { month, year } = req.query;

    const { totalApplicantsInMonth, percentage } = await getApplicantsByMonth(
      month,
      year
    );

    logger.info(`Dashboard data ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Dashboard data ${Message.FETCH_SUCCESSFULLY}`,
      {
        totalApplicantsInMonth,
        percentage: `${percentage}%`,
      }
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch dashboard data`, error);

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch dashboard data`,
      error
    );
  }
};

// export const getApplicantMonthWiseCount = async (req, res) => {
//   try {
//     const { year } = req.query;
//     const data = await getMonthlyApplicantCount(year);

//     return res.status(200).json({
//       success: true,
//       year: year || new Date().getFullYear(),
//       data
//     });
//   } catch (error) {
//     console.error('Error fetching month-wise applicant count:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal Server Error'
//     });
//   }
// };

export const getApplicantMonthWiseCount = async (req, res) => {
  try {
    const { year } = req.query;

    const data = await getMonthlyApplicantCount(year);

    logger.info(`Applicant month-wise count ${Message.FETCH_SUCCESSFULLY}`);

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `Applicant month-wise count ${Message.FETCH_SUCCESSFULLY}`,
      data
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetch applicant month-wise count`, error);

    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetch applicant month-wise count`,
      error
    );
  }
};

