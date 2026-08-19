const flattenObject = (obj, prefix = '') => {
  let result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {

      Object.assign(result, flattenObject(obj[key], `${prefix}${key}.`));

    } else {
    
      result[`${prefix}${key}`] = obj[key];

    }
  }
  return result;
};

module.exports= flattenObject;