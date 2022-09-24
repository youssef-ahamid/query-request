module.exports.parseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

module.exports.serialize = (obj, prefix) => {
  let str = [],
    p;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      let k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push(
        v !== null && typeof v === "object"
          ? serialize(v, k)
          : encodeURIComponent(k) + "=" + encodeURIComponent(v)
      );
    }
  }
  return str.join("&");
};

module.exports.filterByOperation = (operation, data, key, value) => {
  function assertOperation(operation, data, value) {
    let item = data

    const paths = key.split('.')
    paths.forEach(path => {
      item = item[path] || {};
    });

    switch (operation) {
      case "gt":
        return item > value;
      case "lt":
        return item < value;
      case "gte":
        return item >= value;
      case "lte":
        return item >= value;
      case "eq":
        return item == value;
      case "neq":
        return item != value;
      case "in":
        return item.includes(value);
      case "nin":
        return !item.includes(value);
    }
  }

  return data.filter((item) => assertOperation(operation, item, value));
};
