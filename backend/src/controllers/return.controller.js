const returnService = require('../services/return.service');
const { ApiError } = require('../utils/errors');

exports.recordReturn = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const userRole = req.user.role;
    
    const result = await returnService.recordReturn(
      vendorId,
      userRole,
      req.body
    );
    
    res.status(201).json({
      success: true,
      message: result.lateInfo.isLate 
        ? `Return recorded with late fee of ₹${result.lateInfo.lateFee} (${result.lateInfo.daysLate} days late)`
        : 'Return recorded successfully',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getPendingReturns = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const pendingReturns = await returnService.getPendingReturns(vendorId);
    
    const overdueCount = pendingReturns.filter(order => order.has_overdue).length;
    
    res.json({
      success: true,
      data: {
        orders: pendingReturns,
        count: pendingReturns.length,
        overdueCount
      }
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getReturnHistory = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { page, limit, orderId } = req.query;
    
    const result = await returnService.getReturnHistory(vendorId, {
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

exports.getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const userRole = req.user.role;
    
    const returnRecord = await returnService.getReturnById(
      parseInt(id),
      vendorId,
      userRole
    );
    
    res.json({
      success: true,
      data: returnRecord
    });
    
  } catch (error) {
    next(error);
  }
};

exports.calculateLateFee = async (req, res, next) => {
  try {
    const { endDate, returnDate, basePrice, lateFeeRate } = req.body;
    
    const result = returnService.calculateLateFee(
      endDate,
      returnDate || new Date(),
      basePrice,
      lateFeeRate
    );
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};
