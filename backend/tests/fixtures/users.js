module.exports = {
  validCustomer: {
    id: 1,
    name: 'Test Customer',
    email: 'customer@test.com',
    role: 'CUSTOMER',
    is_active: true,
    phone: '9876543210',
    created_at: new Date(),
    updated_at: new Date()
  },
  
  validAdmin: {
    id: 2,
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'ADMIN',
    is_active: true,
    phone: '9876543211',
    created_at: new Date(),
    updated_at: new Date()
  },
  
  validVendor: {
    id: 3,
    name: 'Vendor User',
    email: 'vendor@test.com',
    role: 'VENDOR',
    is_active: true,
    phone: '9876543212',
    company: 'Test Company',
    gstin: 'TEST123456',
    created_at: new Date(),
    updated_at: new Date()
  },

  inactiveUser: {
    id: 4,
    name: 'Inactive User',
    email: 'inactive@test.com',
    role: 'CUSTOMER',
    is_active: false,
    created_at: new Date(),
    updated_at: new Date()
  }
};
