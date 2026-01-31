// Central export for all validation schemas
const productSchemas = require('./product.schema');
const authSchemas = require('./auth.schema');

module.exports = {
  product: productSchemas,
  auth: authSchemas
};
