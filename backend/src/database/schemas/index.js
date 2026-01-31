// Central export for all validation schemas
const productSchemas = require('./product.schema');
const authSchemas = require('./auth.schema');
const reservationSchemas = require('./reservation.schema');
const pickupSchemas = require('./pickup.schema');
const returnSchemas = require('./return.schema');

module.exports = {
  product: productSchemas,
  auth: authSchemas,
  reservation: reservationSchemas,
  ...pickupSchemas,
  ...returnSchemas
};
