export const pagination = async ({ Schema, page, limit }) => {
  const skip = (page - 1) * limit;
  const totalRecords = await Schema.countDocuments();
  const getYears = await Schema.find().skip(skip).limit(limit);

  return {
    totalRecords,
    getYears,
  };
};
