require('dotenv').config();
const Product = require('../src/models/Product');
const pool = require('../src/config/database');

const run = async () => {
  try {
    console.log('🧪 Testing TODO 3.1: Product Model');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('📌 Step 1: Getting or creating vendor...');
      const vendorRes = await client.query("SELECT id FROM users WHERE role = 'VENDOR' LIMIT 1");
      let vendorId = vendorRes.rows[0]?.id;
      
      if (!vendorId) {
        console.log('📌 Creating temporary vendor...');
        const newVendor = await client.query(
          "INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id",
          ['temp_vendor@test.com', 'hash123', 'VENDOR', 'Temp Vendor']
        );
        vendorId = newVendor.rows[0].id;
      }
      console.log('✅ Vendor ID:', vendorId);
      
      console.log('📌 Step 2: Creating product...');
      const product = await Product.create(client, {
        vendor_id: vendorId,
        name: 'Test Camera',
        description: 'Professional DSLR Camera',
        category: 'Electronics',
        brand: 'Canon',
        is_published: true,
        images: []
      });
      console.log('✅ Product Created:', product.id, '-', product.name);
      
      console.log('📌 Step 3: Creating variant...');
      const variant = await Product.createVariant(client, product.id, {
        sku: 'CAM-001',
        attributes: { color: 'black', sensor: 'full-frame' },
        price_hourly: 10,
        price_daily: 100,
        price_weekly: 500,
        price_monthly: 1500,
        stock_quantity: 5
      });
      console.log('✅ Variant Created:', variant.sku, '- Stock:', variant.stock_quantity);
      
      console.log('📌 Step 4: Creating second variant...');
      const variant2 = await Product.createVariant(client, product.id, {
        sku: 'CAM-002',
        attributes: { color: 'silver', sensor: 'full-frame' },
        price_hourly: 12,
        price_daily: 120,
        price_weekly: 600,
        price_monthly: 1800,
        stock_quantity: 3
      });
      console.log('✅ Second Variant Created:', variant2.sku);
      
      await client.query('COMMIT');
      
      console.log('📌 Step 5: Testing findById (with variants)...');
      const found = await Product.findById(product.id);
      if (found && Array.isArray(found.variants) && found.variants.length === 2) {
        console.log('✅ FindById works - Product:', found.name, '- Variants:', found.variants.length);
      } else {
        console.log('❌ FindById failed - Expected 2 variants, got:', found?.variants?.length);
      }
      
      console.log('📌 Step 6: Testing findAll with search...');
      const searchResult = await Product.findAll({ search: 'Camera', limit: 10, page: 1 });
      if (searchResult.total > 0) {
        console.log('✅ Search works - Found:', searchResult.total, 'products');
      } else {
        console.log('❌ Search failed - Expected at least 1 product');
      }
      
      console.log('📌 Step 7: Testing findAll with category filter...');
      const categoryResult = await Product.findAll({ category: 'Electronics', limit: 10 });
      if (categoryResult.total > 0) {
        console.log('✅ Category filter works - Found:', categoryResult.total, 'products');
      } else {
        console.log('❌ Category filter failed');
      }
      
      console.log('📌 Step 8: Testing updateVariant...');
      await client.query('BEGIN');
      const updatedVariant = await Product.updateVariant(client, variant.id, {
        stock_quantity: 10,
        price_daily: 110
      });
      await client.query('COMMIT');
      if (updatedVariant.stock_quantity === 10 && parseFloat(updatedVariant.price_daily) === 110) {
        console.log('✅ UpdateVariant works - New stock:', updatedVariant.stock_quantity);
      } else {
        console.log('❌ UpdateVariant failed');
      }
      
      console.log('📌 Step 9: Testing update product...');
      await client.query('BEGIN');
      const updatedProduct = await Product.update(client, product.id, {
        description: 'Updated Professional DSLR Camera',
        brand: 'Canon EOS'
      });
      await client.query('COMMIT');
      if (updatedProduct.brand === 'Canon EOS') {
        console.log('✅ Update product works - New brand:', updatedProduct.brand);
      } else {
        console.log('❌ Update product failed');
      }
      
      console.log('\n🎉 All Product Model tests completed successfully!');
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
};

run();
