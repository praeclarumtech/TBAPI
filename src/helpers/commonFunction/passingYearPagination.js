export const pagination = async ({ Schema, page, limit }) => {
  const skip = (page - 1) * limit;
  const totalRecords = await Schema.countDocuments();
  const getItem = await Schema.find().skip(skip).limit(limit);

  return {
    totalRecords,
    item: getItem,
    currentPage: page,
    totalPages: totalRecords && limit > 0
      ? Math.ceil(totalRecords / limit)
      : 0,
    limit
  };
};
