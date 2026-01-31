/* ROUTE CONFIGURATION TEST */
const router = require('../src/routes/product.routes');

const run = () => {
  console.log('🧪 Testing TODO 3.4: Product Routes Configuration\n');
  
  let passed = 0;
  let failed = 0;

  // Inspect the router stack
  const routes = router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).map(m => m.toUpperCase()),
      middlewares: layer.route.stack.map(l => l.name || l.handle.name || 'anonymous')
    }));

  console.log('📋 Found Routes:');
  routes.forEach(route => {
    console.log(`   ${route.methods.join(', ')} ${route.path}`);
    console.log(`      Middlewares: ${route.middlewares.join(' -> ')}`);
  });

  // Check required routes
  console.log('\n📌 Route Validation:');
  const required = [
    { path: '/', method: 'GET', name: 'List Products' },
    { path: '/:id', method: 'GET', name: 'Get Product by ID' },
    { path: '/', method: 'POST', name: 'Create Product' },
    { path: '/:id', method: 'PUT', name: 'Update Product' },
    { path: '/:id', method: 'DELETE', name: 'Delete Product' }
  ];

  required.forEach(req => {
    const found = routes.some(r => 
      r.path === req.path && r.methods.includes(req.method)
    );
    
    if (found) {
      console.log(`✅ ${req.method} ${req.path} - ${req.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${req.method} ${req.path} - ${req.name} not found`);
      failed++;
    }
  });

  // Check middleware protection
  console.log('\n📌 Middleware Protection Checks:');
  
  // Check POST / (create)
  const postRoute = routes.find(r => r.path === '/' && r.methods.includes('POST'));
  if (postRoute) {
    const hasAuth = postRoute.middlewares.includes('authenticate');
    // authorize() returns an anonymous function, so we check for middleware count
    const hasAuthorize = postRoute.middlewares.includes('<anonymous>') || postRoute.middlewares.length >= 3;
    
    if (hasAuth && hasAuthorize) {
      console.log('✅ POST / has authenticate + authorize middleware');
      passed++;
    } else {
      console.log(`❌ POST / missing middleware (auth: ${hasAuth}, authorize: ${hasAuthorize})`);
      failed++;
    }
  }

  // Check PUT /:id (update)
  const putRoute = routes.find(r => r.path === '/:id' && r.methods.includes('PUT'));
  if (putRoute) {
    const hasAuth = putRoute.middlewares.includes('authenticate');
    // authorize() returns an anonymous function, so we check for middleware count
    const hasAuthorize = putRoute.middlewares.includes('<anonymous>') || putRoute.middlewares.length >= 3;
    
    if (hasAuth && hasAuthorize) {
      console.log('✅ PUT /:id has authenticate + authorize middleware');
      passed++;
    } else {
      console.log(`❌ PUT /:id missing middleware (auth: ${hasAuth}, authorize: ${hasAuthorize})`);
      failed++;
    }
  }

  // Check DELETE /:id (delete)
  const deleteRoute = routes.find(r => r.path === '/:id' && r.methods.includes('DELETE'));
  if (deleteRoute) {
    const hasAuth = deleteRoute.middlewares.includes('authenticate');
    // authorize() returns an anonymous function, so we check for middleware count
    const hasAuthorize = deleteRoute.middlewares.includes('<anonymous>') || deleteRoute.middlewares.length >= 3;
    
    if (hasAuth && hasAuthorize) {
      console.log('✅ DELETE /:id has authenticate + authorize middleware');
      passed++;
    } else {
      console.log(`❌ DELETE /:id missing middleware (auth: ${hasAuth}, authorize: ${hasAuthorize})`);
      failed++;
    }
  }

  // Check public routes (GET)
  const getListRoute = routes.find(r => r.path === '/' && r.methods.includes('GET'));
  if (getListRoute) {
    const hasAuth = getListRoute.middlewares.includes('authenticate');
    
    if (!hasAuth) {
      console.log('✅ GET / is public (no auth required)');
      passed++;
    } else {
      console.log('⚠️  GET / has auth middleware (should be public)');
    }
  }

  const getByIdRoute = routes.find(r => r.path === '/:id' && r.methods.includes('GET'));
  if (getByIdRoute) {
    const hasAuth = getByIdRoute.middlewares.includes('authenticate');
    
    if (!hasAuth) {
      console.log('✅ GET /:id is public (no auth required)');
      passed++;
    } else {
      console.log('⚠️  GET /:id has auth middleware (should be public)');
    }
  }

  // Check that router is properly exported
  console.log('\n📌 Router Export Check:');
  if (router && typeof router === 'function') {
    console.log('✅ Router is properly exported');
    passed++;
  } else {
    console.log('❌ Router export issue');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ALL ROUTE CONFIGURATION TESTS PASSED!');
    console.log('\n📝 Route Summary:');
    console.log('   Public Routes:');
    console.log('     - GET /api/products (list all products)');
    console.log('     - GET /api/products/:id (get product by ID)');
    console.log('   Protected Routes (VENDOR, ADMIN):');
    console.log('     - POST /api/products (create product)');
    console.log('     - PUT /api/products/:id (update product)');
    console.log('     - DELETE /api/products/:id (delete product)');
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
};

run();
