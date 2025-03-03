import mongoose from 'mongoose';

export const commonSearch = async (model, searchFields, query, page = 1, limit = 10, sort = { createdAt: -1 }) => {
  if (!query || typeof query !== 'string') {
    return { results: [], totalRecords: 0 };
  }

  const searchConditions = searchFields.map(field => ({
    [field]: { $regex: query, $options: 'i' }
  }));

  const filterQuery = {
    $or: searchConditions,
    isDeleted: false
  };

  const totalRecords = await model.countDocuments(filterQuery);
  const results = await model.find(filterQuery)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { results, totalRecords };
};

