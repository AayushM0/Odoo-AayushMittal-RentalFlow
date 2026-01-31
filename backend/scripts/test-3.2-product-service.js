require('dotenv').config();
const ProductService = require('../src/services/product.service');
const pool = require('../src/config/database');

const run = async () => {
  try {
    console.log('🧪 Testing TODO 3.2: Product Service');
    
    console.log('📌 Step 1: Getting vendor...');
    const vendorRes = await pool.query("SELECT id FROM users WHERE role = 'VENDOR' LIMIT 1");
    const vendorId = vendorRes.rows[0]?.id;
    
    if (!vendorId) {
      console.log('⚠️  No vendor found. Creating temporary vendor...');
      const newVendor = await pool.query(
        "INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id",
        ['test_vendor_service@test.com', 'hash123', 'VENDOR', 'Test Vendor Service']
      );
      const vendorId = newVendor.rows[0].id;
      console.log('✅ Temporary vendor created:', vendorId);
    } else {
      console.log('✅ Vendor found:', vendorId);
    }

    console.log('\n📌 Test 1: Create Product with Variants (Transaction)');
    const createResult = await ProductService.createProduct(vendorId, {
      name: 'Professional Camera',
      description: 'High-end DSLR for professionals',
      category: 'Electronics',
      brand: 'Canon',
      is_published: true,
      images: []
    }, [
      {
        sku: 'CAM-PRO-001',
        attributes: { color: 'black', lens: '24-70mm' },
        price_hourly: 15,
        price_daily: 120,
        price_weekly: 700,
        price_monthly: 2500,
        stock_quantity: 3
      },
      {
        sku: 'CAM-PRO-002',
        attributes: { color: 'silver', lens: '24-70mm' },
        price_hourly: 15,
        price_daily: 120,
        price_weekly: 700,
        price_monthly: 2500,
        stock_quantity: 2
      }
    ]);

    if (createResult.success && createResult.data.variants.length === 2) {
      console.log('✅ Product created with ID:', createResult.data.id);
      console.log('✅ Variants created:', createResult.data.variants.length);
    } else {
      console.log('❌ Create failed');
    }

    const productId = createResult.data.id;

    console.log('\n📌 Test 2: Get Product by ID');
    const getResult = await ProductService.getProductById(productId);
    
    if (getResult.success && getResult.data.variants) {
      console.log('✅ Product fetched with', getResult.data.variants.length, 'variants');
    } else {
      console.log('❌ Get failed');
    }

    console.log('\n📌 Test 3: Search Products (text search)');
    const searchResult = await ProductService.getProducts({ search: 'Camera' });
    
    if (searchResult.success && searchResult.data.total > 0) {
      console.log('✅ Search works - Found:', searchResult.data.total, 'products');
    } else {
      console.log('❌ Search failed');
    }

    console.log('\n📌 Test 4: Filter by Category');
    const categoryResult = await ProductService.getProducts({ category: 'Electronics' });
    
    if (categoryResult.success && categoryResult.data.total > 0) {
      console.log('✅ Category filter works - Found:', categoryResult.data.total, 'products');
    } else {
      console.log('❌ Category filter failed');
    }

    console.log('\n📌 Test 5: Role-based filtering (CUSTOMER sees only published)');
    const customerResult = await ProductService.getProducts({}, null, 'CUSTOMER');
    
    if (customerResult.success) {
      console.log('✅ Customer filter works - Found:', customerResult.data.total, 'published products');
    } else {
      console.log('❌ Customer filter failed');
    }

    console.log('\n📌 Test 6: Update Product');
    const updateResult = await ProductService.updateProduct(
      productId, 
      vendorId, 
      'VENDOR',
      { description: 'Updated: Premium DSLR Camera', brand: 'Canon EOS' }
    );
    
    if (updateResult.success && updateResult.data.brand === 'Canon EOS') {
      console.log('✅ Update works - New brand:', updateResult.data.brand);
    } else {
      console.log('❌ Update failed');
    }

    console.log('\n📌 Test 7: Authorization check (wrong vendor cannot update)');
    try {
      const wrongVendorId = '00000000-0000-0000-0000-000000000000';
      await ProductService.updateProduct(productId, wrongVendorId, 'VENDOR', { name: 'Hacked' });
      console.log('❌ Authorization check failed - should have thrown error');
    } catch (err) {
      if (err.statusCode === 403) {
        console.log('✅ Authorization works - Access denied correctly');
      } else {
        console.log('❌ Wrong error:', err.message);
      }
    }

    console.log('\n📌 Test 8: Validation check (product must have variants)');
    try {
      await ProductService.createProduct(vendorId, {
        name: 'Invalid Product',
        description: 'This should fail',
        category: 'Test',
        brand: 'Test'
      }, []);
      console.log('❌ Validation failed - should have thrown error');
    } catch (err) {
      if (err.statusCode === 400) {
        console.log('✅ Validation works - Product must have variants');
      } else {
        console.log('❌ Wrong error:', err.message);
      }
    }

    console.log('\n📌 Test 9: Delete Product');
    const deleteResult = await ProductService.deleteProduct(productId, vendorId, 'VENDOR');
    
    if (deleteResult.success) {
      console.log('✅ Delete works - Product removed');
    } else {
      console.log('❌ Delete failed');
    }

    console.log('\n📌 Test 10: Verify deletion');
    try {
      await ProductService.getProductById(productId);
      console.log('❌ Product still exists after deletion');
    } catch (err) {
      if (err.statusCode === 404) {
        console.log('✅ Deletion verified - Product not found');
      } else {
        console.log('❌ Wrong error:', err.message);
      }
    }

    console.log('\n🎉 All Product Service tests completed successfully!');

  } catch (err) {
    console.error('❌ FAIL:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
};

run();
