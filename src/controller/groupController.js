import {
  createSmsGroupsService,
  getAllSmsGroupsService,
  sendSMSToGroupMembersService,
} from '../services/groupService.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';

export const createSmsGroups = async (req, res) => {
  try {
    const { group_name, applicant_id } = req.body;
    const user_id = req.user.id;

    if (
      !group_name ||
      typeof group_name !== 'string' ||
      group_name.trim() === ''
    ) {
      logger.error(`Group name ${Message.FIELD_REQUIRED}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Group name ${Message.FIELD_REQUIRED}`
      );
    }

    const newGroup = await createSmsGroupsService(
      group_name,
      applicant_id,
      user_id
    );
    logger.info(`group ${Message.CREATED_SUCCESSFULLY}.`);

    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      `group ${Message.CREATED_SUCCESSFULLY}.`,
      newGroup
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} creating group`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

export const getAllSmsGroups = async (req, res) => {
  try {
    const groups = await getAllSmsGroupsService();
    logger.info(`all groups ${Message.FETCH_SUCCESSFULLY}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `all groups ${Message.FETCH_SUCCESSFULLY}`,
      groups
    );
  } catch (error) {
    logger.error(`${Message.FAILED_TO} fetching groups`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `${Message.FAILED_TO} fetching groups`
    );
  }
};

export const sendSMSToGroupMembers = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        `Group ID and message${Message.FIELD_REQUIRED}`
      );
    }

    const response = await sendSMSToGroupMembersService(groupId, message);
    logger.info(`SMS sent to group ${groupId}`);

    return HandleResponse(res, true, StatusCodes.OK, response.message);
  } catch (error) {
    logger.error(`${Message.FAILED_TO} sending SMS to group members`, error);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};
