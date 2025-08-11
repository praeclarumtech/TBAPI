export const pagination = async ({
  Schema,
  page,
  limit,
  query = {},
  sort = {},
  populate = {}
}) => {
  const skip = (page - 1) * limit;

  const totalRecords = await Schema.countDocuments(query);

  const getItem = await Schema.find(query).sort(sort).skip(skip).limit(limit).populate(populate);

  const totalPages =
    totalRecords && limit > 0 ? Math.ceil(totalRecords / limit) : 0;

  return {
    item: getItem,
    totalRecords, 
    currentPage: page,
    totalPages,
    limit,
  };
};
