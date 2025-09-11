import { StatusCodes } from 'http-status-codes';
import Role from '../models/roleModel.js';
import logger from '../loggers/logger.js';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';

export const createRole = async (req, res) => {
  try {
    const exists = await Role.findOne({ name: req.body.name});
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
    const roles = await Role.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

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
    const role = await Role.findOne({ _id: req.params.id, isDeleted: false });
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
    const updates = req.body;

    // validate status if included
    if (updates.hasOwnProperty('status')) {
      if (typeof updates.status === 'string') {
        updates.status = updates.status.toLowerCase() === 'true';
      } else if (typeof updates.status !== 'boolean') {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Invalid status value. Must be true (active) or false (inactive).'
        );
      }
    }

    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, // only non-deleted roles
      updates,
      { new: true }
    );

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

    // custom message if status was updated
    const message = updates.hasOwnProperty('status')
      ? `Role status updated to ${
          updates.status ? 'active' : 'inactive'
        } successfully`
      : Message.UPDATE_SUCCESS;

    return HandleResponse(res, true, StatusCodes.OK, message, role);
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
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true }, // only mark deleted
      { new: true }
    );

    if (!role) {
      logger.warn(`Delete failed - Role not found: ${req.params.id}`);
      return HandleResponse(
        res,
        false,
        StatusCodes.NOT_FOUND,
        Message.NOT_FOUND
      );
    }

    logger.info(`Role deleted: ${role._id}`);
    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      'Role deleted successfully',
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
