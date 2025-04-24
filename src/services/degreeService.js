import Degree from '../models/degreeModel.js';
import { pagination } from '../helpers/commonFunction/handlePagination.js';

export const create = async (body) => {
    const degree = new Degree({ ...body });
    return degree.save();
};

export const getAllDegree = async (page, limit) => {
    return Degree.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

export const getDegreeById = async (id) => {
    return Degree.findOne({ _id: id, isDeleted: false });
};

export const updateDegree = async (id, updateData) => {
    return Degree.updateOne({ _id: id }, updateData);
};

export const deleteManyDegrees = async (ids) => {
    return await Degree.deleteMany({ _id: { $in: ids } });
};