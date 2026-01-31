const pickupService = require('../services/pickup.service');

exports.recordPickup = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const userRole = req.user.role;
    
    const result = await pickupService.recordPickup(
      vendorId,
      userRole,
      req.body
    );
    
    res.status(201).json({
      success: true,
      message: 'Pickup recorded successfully',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getPendingPickups = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const pendingPickups = await pickupService.getPendingPickups(vendorId);
    
    res.json({
      success: true,
      data: {
        orders: pendingPickups,
        count: pendingPickups.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getPickupHistory = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { page, limit, orderId } = req.query;
    
    const result = await pickupService.getPickupHistory(vendorId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      orderId
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getPickupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const userRole = req.user.role;
    
    const pickup = await pickupService.getPickupById(
      parseInt(id),
      vendorId,
      userRole
    );
    
    res.json({
      success: true,
      data: pickup
    });
    
  } catch (error) {
    next(error);
  }
};
