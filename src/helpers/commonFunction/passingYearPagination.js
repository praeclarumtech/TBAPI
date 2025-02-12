export const pagination = async ({ Schema, page, limit,query ={} }) => {
  const skip = (page - 1) * limit;
  const totalRecords = await Schema.countDocuments(query);
  const getYears = await Schema.find(query).skip(skip).limit(limit);

  return {
    totalRecords,
    getYears,
  };
};
