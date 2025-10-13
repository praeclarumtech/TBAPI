import Role from '../models/roleModel.js';
import { PermissionKey } from '../utils/enum.js';

export const createRoleService = async (roleData) => {
  const exists = await Role.findOne({ name: roleData.name });
  if (exists) {
    throw new Error('Role already exists');
  }
  const newRole = new Role(roleData);
  return await newRole.save();
};

export const getRolesService = async () => {
  return await Role.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
};

export const getRoleByIdService = async (id) => {
  return await Role.findOne({
    _id: id,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
};

export const getRoleByNameService = async (name) => {
  return await Role.findOne({
    name: name,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
};

export const updateRoleService = async (id, updates) => {
  // handle status normalization here
  if (updates.hasOwnProperty('status')) {
    if (typeof updates.status === 'string') {
      updates.status = updates.status.toLowerCase() === 'true';
    }
  }

  return await Role.findOneAndUpdate(
    {
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    },
    updates,
    {
      new: true,
    }
  );
};

export const deleteRoleService = async (id) => {
  return await Role.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const assignPermissionsService = async (id, assignRoleDto) => {
  const { accessModules } = assignRoleDto;

  // Validate that all permission keys are valid
  const validPermissions = Object.values(PermissionKey);

  const invalidPermissions = accessModules.filter(
    (permission) => !validPermissions.includes(permission)
  );

  if (invalidPermissions.length > 0) {
    throw new Error(
      `Invalid permission keys: ${invalidPermissions.join(
        ', '
      )}. Valid keys are: ${validPermissions.join(', ')}`
    );
  }

  // Check if role exists first
  const existingRole = await Role.findOne({
    _id: id,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
  if (!existingRole) {
    throw new Error('Role not found');
  }

  return await Role.findOneAndUpdate(
    {
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    },
    { accessModules },
    { new: true }
  );
};
