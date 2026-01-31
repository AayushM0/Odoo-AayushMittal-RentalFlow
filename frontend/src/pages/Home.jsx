function Home() {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Rental ERP System
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome to the Rental Management Platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Browse Products</h2>
            <p className="text-gray-600">Explore our rental inventory</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">My Orders</h2>
            <p className="text-gray-600">Track your rental orders</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Get Started</h2>
            <p className="text-gray-600">Sign up or login to continue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
