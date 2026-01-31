const Joi = require('joi');

const recordPickupSchema = Joi.object({
  orderId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Order ID must be a number',
      'number.positive': 'Order ID must be positive',
      'any.required': 'Order ID is required'
    }),
  
  reservationIds: Joi.array().items(Joi.number().integer().positive()).optional()
    .messages({
      'array.base': 'Reservation IDs must be an array'
    }),
  
  pickedUpBy: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Picked up by name must be at least 2 characters',
      'string.max': 'Picked up by name cannot exceed 255 characters',
      'any.required': 'Picked up by name is required'
    }),
  
  notes: Joi.string().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

module.exports = {
  recordPickupSchema
};
