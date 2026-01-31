module.exports = {
  validProduct: {
    id: 1,
    name: 'Test Product',
    description: 'Test product description',
    category: 'Electronics',
    vendor_id: 3,
    min_price: 100,
    max_price: 500,
    total_stock: 50,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },

  productWithVariants: {
    id: 2,
    name: 'Product with Variants',
    description: 'Product with multiple variants',
    category: 'Furniture',
    vendor_id: 3,
    min_price: 200,
    max_price: 1000,
    total_stock: 30,
    is_active: true,
    variants: [
      {
        id: 1,
        product_id: 2,
        name: 'Small',
        sku: 'PROD-SMALL',
        stock: 10,
        hourly_rate: 50,
        daily_rate: 200,
        weekly_rate: 1000
      },
      {
        id: 2,
        product_id: 2,
        name: 'Large',
        sku: 'PROD-LARGE',
        stock: 20,
        hourly_rate: 80,
        daily_rate: 300,
        weekly_rate: 1500
      }
    ]
  },

  inactiveProduct: {
    id: 3,
    name: 'Inactive Product',
    description: 'This product is inactive',
    category: 'Other',
    vendor_id: 3,
    is_active: false,
    created_at: new Date(),
    updated_at: new Date()
  }
};
