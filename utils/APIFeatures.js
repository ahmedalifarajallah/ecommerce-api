class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = {};
    for (let key in this.queryString) {
      if (key.includes("[")) {
        const newKey = key.split("[")[0];
        const option = key.split("[")[1].split("]")[0];
        if (!queryObj[newKey]) queryObj[newKey] = {};
        queryObj[newKey]["$" + option] = this.queryString[key];
      } else {
        queryObj[key] = this.queryString[key];
      }
    }

    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);

    this.query = this.query.find(queryObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // TODO: LimitFields, Pagination
}

module.exports = APIFeatures;
