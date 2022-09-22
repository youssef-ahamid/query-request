const Fuse = require("fuse.js");
const { invalidQuery } = require("./errors.js");
const { filterByOperation, parseJSON } = require("./parser.js");

class Query {
  constructor(query = {}, data = [], total) {
    this.query = query;
    this.data = data;
    this.total = total || data.length;
    this.errors = [];
  }

  timebox() {
    const {
      created_after,
      created_before,
      updated_after,
      updated_before,
      create_prop,
      update_prop,
    } = this.query;

    if (created_after)
      this.data = this.data.filter((item) => {
        console.log(new Date(created_after), item[create_prop || "createdAt"]);
        return item[create_prop || "createdAt"] > new Date(created_after);
      });
    if (created_before)
      this.data = this.data.filter(
        (item) => item[create_prop || "createdAt"] < new Date(created_before)
      );
    if (updated_after)
      this.data = this.data.filter(
        (item) => item[update_prop || "updatedAt"] > new Date(updated_after)
      );
    if (updated_before)
      this.data = this.data.filter(
        (item) => item[update_prop || "updatedAt"] < new Date(updated_before)
      );
  }

  filter() {
    const { filter_fn, filter_value, filter_prop } = this.query;

    if (filter_fn && filter_value)
      this.data = filterByOperation(
        filter_fn,
        this.data,
        filter_prop,
        filter_value
      );
  }

  async search(opts = {}) {
    let { search_paths, search_query, search_case_sensitive } = this.query;

    let search = {
      paths: opts.paths || search_paths,
      query: opts.query || search_query,
      isCaseSensitive: opts.isCaseSensitive || search_case_sensitive,
    };
    if (!search.paths || !search.query) return;

    search.paths = search.paths.split(" ");
    for (let i = 0; i < search.paths.length; i++)
      search.paths[i] = parseJSON(search.paths[i]);

    const options = {
      isCaseSensitive:
        search.isCaseSensitive === true || search.isCaseSensitive === "true",
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      keys: search.paths,
    };

    const fuse = new Fuse(this.data, options);
    this.data = (await fuse.search(search.query)).map((result) => {
      return {
        ...result.item._doc,
        score: result.score,
        matches: result.matches,
      };
    });
  }

  sort() {
    const { sort_prop, sort_dir, sort_fn } = this.query;
    const compareProp = (a, b) => {
      let first;

      switch (sort_fn) {
        case "locale":
          first = a[sort_prop].localeCompare(b[sort_prop]);
          break;
        default:
          first = a[sort_prop] - b[sort_prop];
          break;
      }

      if (sort_dir === "desc") first *= -1;
      return first;
    };

    this.data = this.data.sort(compareProp);
  }

  paginate() {
    let { page, limit } = this.query;

    if (!limit) limit = this.data.length;
    else {
      limit = parseInt(limit);
      if (isNaN(limit))
        return this.errors.push(invalidQuery("limit", "integer"));
    }

    if (!page) page = 1;
    else {
      page = parseInt(page);
      if (isNaN(page)) return this.errors.push(invalidQuery("page", "integer"));
    }

    const skip = (page - 1) * limit;
    this.data = this.data.slice(skip, skip + limit);
  }

  async apply(query = this.query, data = this.data, total) {
    this.query = query;
    this.data = data;
    this.total = total;
    this.timebox();
    this.filter();
    await this.search();
    this.sort();
    this.paginate();

    if (this.errors.length > 0) return this.errors[0];

    return { total: this.total, data: this.data };
  }
}

module.exports = Query;

module.exports.q = new Query();

module.exports.queryable = async (req, res, next) => {
  const query = new Query(req.query);
  req.q = query;

  req.applyQuery = async (data, total) => {
    return query.apply(req.query, data, total);
  };

  next();
};
