const Joi = require('joi');

const recordReturnSchema = Joi.object({
  orderId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Order ID must be a number',
      'number.positive': 'Order ID must be positive',
      'any.required': 'Order ID is required'
    }),
  
  reservationId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Reservation ID must be a number',
      'number.positive': 'Reservation ID must be positive',
      'any.required': 'Reservation ID is required'
    }),
  
  pickupId: Joi.number().integer().positive().optional().allow(null)
    .messages({
      'number.base': 'Pickup ID must be a number',
      'number.positive': 'Pickup ID must be positive'
    }),
  
  conditionNotes: Joi.string().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'Condition notes cannot exceed 1000 characters'
    })
});

const calculateLateFeeSchema = Joi.object({
  endDate: Joi.date().iso().required()
    .messages({
      'date.base': 'End date must be a valid date',
      'any.required': 'End date is required'
    }),
  
  returnDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Return date must be a valid date'
    }),
  
  basePrice: Joi.number().positive().required()
    .messages({
      'number.base': 'Base price must be a number',
      'number.positive': 'Base price must be positive',
      'any.required': 'Base price is required'
    }),
  
  lateFeeRate: Joi.number().min(0).max(1).optional()
    .messages({
      'number.base': 'Late fee rate must be a number',
      'number.min': 'Late fee rate cannot be negative',
      'number.max': 'Late fee rate cannot exceed 100%'
    })
});

module.exports = {
  recordReturnSchema,
  calculateLateFeeSchema
};
