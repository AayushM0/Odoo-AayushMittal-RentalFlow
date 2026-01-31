const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminUserController = require('../controllers/adminUser.controller');

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminUserController.getUserStats);
router.get('/', adminUserController.getUsers);
router.get('/:id', adminUserController.getUserById);
router.post('/', adminUserController.createUser);
router.put('/:id', adminUserController.updateUser);
router.put('/:id/toggle-status', adminUserController.toggleUserStatus);
router.put('/:id/reset-password', adminUserController.resetPassword);
router.delete('/:id', adminUserController.deleteUser);

module.exports = router;
