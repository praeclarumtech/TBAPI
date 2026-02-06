import mongoose from 'mongoose';

/** Escape string for safe use inside RegExp */
const escapeRegex = (str) => (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  if (query && typeof query === 'string') {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
      // Multi-word: each word must match at least one of the fields (e.g. "Hardik Test" -> firstName Hardik + lastName Test)
      const escapedWords = words.map((w) => escapeRegex(w));
      const wordConditions = escapedWords.map((word) => ({
        $or: searchFields.map((field) => ({
          [field]: { $regex: word, $options: 'i' },
        })),
      }));
      searchConditions.push(...wordConditions);
    }
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
      $and: [baseFilter, ...searchConditions],
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
