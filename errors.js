module.exports.invalidQuery = (name, type) => {
  return {
    error: {
      message: `Invalid query. ${name} must be of type ${type}.`,
      code: 400,
      error: {
        field: name,
        name: "validation/invalid-query",
      },
    },
  };
};
