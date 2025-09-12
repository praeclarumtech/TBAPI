import Role from '../models/roleModel.js';

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
  return await Role.findOne({ _id: id, isDeleted: false });
};

export const updateRoleService = async (id, updates) => {
  // handle status normalization here
  if (updates.hasOwnProperty('status')) {
    if (typeof updates.status === 'string') {
      updates.status = updates.status.toLowerCase() === 'true';
    }
  }

  return await Role.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true }
  );
};

export const deleteRoleService = async (id) => {
  return await Role.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};
