const Joi = require('joi');

// Product validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().required(),
  brand: Joi.string(),
  is_published: Joi.boolean().default(false),
  images: Joi.array().items(Joi.string()),
  variants: Joi.array().min(1).items(
    Joi.object({
      sku: Joi.string().required(),
      attributes: Joi.object(),
      price_hourly: Joi.number().min(0),
      price_daily: Joi.number().min(0),
      price_weekly: Joi.number().min(0),
      price_monthly: Joi.number().min(0),
      stock_quantity: Joi.number().integer().min(0).required()
    })
  ).required()
});

const updateProductSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  category: Joi.string(),
  brand: Joi.string(),
  is_published: Joi.boolean(),
  images: Joi.array().items(Joi.string())
});

module.exports = {
  createProductSchema,
  updateProductSchema
};
