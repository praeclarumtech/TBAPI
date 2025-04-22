import designations from '../models/designationModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';

export const create = async (body) => {
  const designation = new designations({ ...body });
  return designation.save();
};

export const getAllDesignation = async (page, limit) => {
  return designations.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const getDesignationById = async (id) => {
  return designations.findOne({ _id: id, isDeleted: false });
};

export const updateDesignation = async (id, updateData) => {
  return designations.updateOne({_id: id}, updateData);
};

export const deleteDesignationById = async (id) => {
  return designations.deleteOne({ _id: id });
};

export const removeManyDesignation = async (ids) => {
  return await designations.deleteMany({ _id: { $in: ids } });
};