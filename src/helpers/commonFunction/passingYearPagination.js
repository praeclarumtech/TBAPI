export const pagination = async ({ Schema, page, limit, query ={}, sort = {} }) => {
  const skip = (page - 1) * limit;
  const totalRecords = await Schema.countDocuments(query);
  const getYears = await Schema.find(query).sort(sort).skip(skip).limit(limit);

  return {
    totalRecords,
    getYears,
  };
};
