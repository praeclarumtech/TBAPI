import mongoose from 'mongoose';

export const commonSearch = async (
  model,
  searchFields,
  query,
  searchSkills = '',
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  additionalFilter = {}
) => {
  if ((!query || typeof query !== 'string') && !searchSkills) {
    return { results: [], totalRecords: 0 };
  }
  const searchConditions = [];

  if (query) {
    searchConditions.push(
      ...searchFields.map((field) => ({
        [field]: { $regex: `^${query}`, $options: 'i' },
      }))
    );
  }

  if (typeof searchSkills === 'string' && searchSkills.trim().length > 0) {
    const skillsArray = searchSkills.split(',').map((skill) => skill.trim());
    searchConditions.push({
      appliedSkills: { $all: skillsArray },
    });
  }

  let baseFilter = {
    isDeleted: false,
    ...additionalFilter,
  };
  let filterQuery = baseFilter;
  if (searchConditions.length > 0) {
    filterQuery = {
      $and: [baseFilter, { $or: searchConditions }],
    };
  }
  const totalRecords = await model.countDocuments(filterQuery);
  const results = await model
    .find(filterQuery)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { results, totalRecords };
};