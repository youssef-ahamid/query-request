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
    switch (operation) {
      case "gt":
        return data > value;
      case "lt":
        return data < value;
      case "gte":
        return data >= value;
      case "lte":
        return data >= value;
      case "eq":
        return data == value;
      case "neq":
        return data != value;
      case "in":
        return data.includes(value);
      case "nin":
        return !data.includes(value);
    }
  }

  return data.filter((item) => assertOperation(operation, item[key], value));
};
