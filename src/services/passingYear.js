import PassingYear from '../models/passingYear.js';

export const createYear = async (year) => {
  return await PassingYear.create({ year });
};

export const getOneYear = async (id) => {
  return await PassingYear.findById(id);
};

export const updateYearById = async (id, updateData) => {
  return await PassingYear.findByIdAndUpdate(id, updateData);
};

export const deleteYearById = async (id) => {
  return await PassingYear.findByIdAndDelete(id, { is_deleted: true });
};
