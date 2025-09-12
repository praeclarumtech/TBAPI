import { StatusCodes } from 'http-status-codes';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';
import {
  createRoleService,
  getRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService,
} from '../services/roleService.js';

export const createRole = async (req, res) => {
  try {
    const newRole = await createRoleService(req.body);
    logger.info(`Role created: ${newRole._id}`);
    return HandleResponse(res, true, StatusCodes.CREATED, Message.CREATED_SUCCESS, newRole);
  } catch (error) {
    logger.error(`Create role failed: ${error.message}`, { stack: error.stack });
    const status = error.message === 'Role already exists' ? StatusCodes.CONFLICT : StatusCodes.INTERNAL_SERVER_ERROR;
    return HandleResponse(res, false, status, error.message);
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await getRolesService();
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCH_SUCCESS, roles);
  } catch (error) {
    logger.error(`Get roles failed: ${error.message}`, { stack: error.stack });
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await getRoleByIdService(req.params.id);
    if (!role) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, Message.NOT_FOUND);
    }
    return HandleResponse(res, true, StatusCodes.OK, Message.FETCH_SUCCESS, role);
  } catch (error) {
    logger.error(`Get role by ID failed: ${error.message}`, { stack: error.stack });
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const updateRole = async (req, res) => {
  try {
    const role = await updateRoleService(req.params.id, req.body);
    if (!role) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, Message.NOT_FOUND);
    }
    return HandleResponse(res, true, StatusCodes.OK, Message.UPDATE_SUCCESS, role);
  } catch (error) {
    logger.error(`Update role failed: ${error.message}`, { stack: error.stack });
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await deleteRoleService(req.params.id);
    if (!role) {
      return HandleResponse(res, false, StatusCodes.NOT_FOUND, Message.NOT_FOUND);
    }
    return HandleResponse(res, true, StatusCodes.OK, 'Role deleted successfully', role);
  } catch (error) {
    logger.error(`Delete role failed: ${error.message}`, { stack: error.stack });
    return HandleResponse(res, false, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
