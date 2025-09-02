import { StatusCodes } from 'http-status-codes';
import Role from '../models/roleModel.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';

export const createRole = async (req, res) => {
  try {
    const exists = await Role.findOne({ name: req.body.name });
    if (exists) {
      return HandleResponse(
        res,
        false,
        StatusCodes.CONFLICT,
        'Role already exists'
      );
    }

    const newRole = new Role(req.body);
    await newRole.save();

    logger.info(`Role created: ${newRole._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.CREATED,
      Message.CREATED_SUCCESS,
      newRole
    );
  } catch (error) {
    logger.error(`Create role failed: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      null,
      null,
      error.message
    );
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ status: 'active' });

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCH_SUCCESS,
      roles
    );
  } catch (error) {
    logger.error(`Get roles failed: ${error.message}`, { stack: error.stack });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      null,
      null,
      error.message
    );
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById({ _id: req.params.id, status: 'active' });
    if (!role) {
      logger.warn(`Role not found or inactive: ${req.params.id}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.FETCH_SUCCESS,
      role
    );
  } catch (error) {
    logger.error(`Get role by ID failed: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      null,
      null,
      error.message
    );
  }
};

export const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!role) {
      logger.warn(`Update failed - Role not found: ${req.params.id}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }

    logger.info(`Role updated: ${role._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      Message.UPDATE_SUCCESS,
      role
    );
  } catch (error) {
    logger.error(`Update role failed: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      null,
      null,
      error.message
    );
  }
};




export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'inactive', isDeleted: true },
      { new: true }
    );

    if (!role) {
      logger.warn(
        `Delete failed - Role not found or already inactive: ${req.params.id}`
      );
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }

    logger.info(`Role marked inactive: ${role._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Role deactivated successfully',
      role
    );
  } catch (error) {
    logger.error(`Delete role failed: ${error.message}`, {
      stack: error.stack,
    });
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      null,
      null,
      error.message
    );
  }
};
