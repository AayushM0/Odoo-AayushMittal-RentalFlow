const Joi = require('joi');

// Reusable field schemas
const email = Joi.string().email().required();
const password = Joi.string().min(8).required();
const phone = Joi.string().pattern(/^[0-9]{10}$/).required();
const gstin = Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);

// Auth validation schemas
const registerSchema = Joi.object({
  email,
  password,
  role: Joi.string().valid('CUSTOMER', 'VENDOR').required(),
  name: Joi.string().required(),
  company: Joi.string().when('role', {
    is: 'VENDOR',
    then: Joi.required(),
    otherwise: Joi.allow('')
  }),
  category: Joi.string().when('role', {
    is: 'VENDOR',
    then: Joi.required(),
    otherwise: Joi.allow('')
  }),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).when('role', {
    is: 'VENDOR',
    then: Joi.required().messages({
      'any.required': 'GSTIN is required for vendors (needed for invoicing)',
      'string.pattern.base': 'GSTIN must be in valid format (e.g., 22AAAAA0000A1Z5)',
      'string.empty': 'GSTIN cannot be empty for vendors'
    }),
    otherwise: Joi.allow('')
  }),
  phone,
  address: Joi.object().optional(),
  profile_image: Joi.string().uri().allow('', null)
});

const loginSchema = Joi.object({
  email,
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  // Export reusable field schemas
  schemas: {
    email,
    password,
    phone,
    gstin
  }
};
