module.exports = function ApiFeatures(mongoQuery, urlQuery) {
  function sort() {
    if (urlQuery.sort) {
      const sortOptions = urlQuery.sort.replace(/,/g, ' ');
      mongoQuery.sort(sortOptions);
    } else {
      mongoQuery.sort('createdAt');
    }
    return ApiFeatures(mongoQuery, urlQuery);
  }
  function selectFields() {
    if (urlQuery.fields) {
      const fieldOptions = urlQuery.fields.replace(/,/g, ' ');
      mongoQuery.select(fieldOptions);
    }
    return ApiFeatures(mongoQuery, urlQuery);
  }
  function skipAndLimit(skip, limit) {
    mongoQuery.skip(skip).limit(limit);
    return ApiFeatures(mongoQuery, urlQuery);
  }
  return { sort, selectFields, skipAndLimit };
};
