# 🏢 Rental Management ERP System

An Odoo-inspired, full-stack rental management platform built with the PERN stack (PostgreSQL, Express, React, Node.js).

## 🎯 Overview

This system manages the complete rental lifecycle from quotation to invoice, featuring:
- Multi-role access (Customer, Vendor, Admin)
- Real-time inventory management with anti-overbooking
- Automated invoicing with GST calculations
- State machine workflows (Odoo-inspired)
- Audit logging and RBAC

## 🏗️ Architecture

```
06_SRC/
├── backend/         # Node.js/Express API
├── frontend/        # React/Vite UI
├── shared/          # Shared schemas & types
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Installation

```bash
# Clone and navigate
cd 06_SRC/

# Install all dependencies
npm install
npm install --workspaces

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Start development servers
./run.sh
# OR
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

## 📚 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with pg library
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6

## 🗂️ Project Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed structure.

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/rental_erp
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm test --workspace=backend

# Frontend tests only
npm test --workspace=frontend
```

## 📖 API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

### Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - Browse products
- `POST /api/quotations` - Create quotation
- `POST /api/orders` - Confirm order

## 🎭 User Roles

### Customer
- Browse products
- Create quotations
- Confirm orders
- View invoices

### Vendor
- Manage products
- Process orders
- Handle pickup/returns
- Generate invoices

### Admin
- User management
- System configuration
- Reports & analytics

## 🔄 Workflows

### Order Flow
```
Quotation (draft) → Order (reserved) → Pickup (active) → Return (returned) → Invoice (closed)
```

### Reservation System
- Real-time availability checking
- Anti-overbooking logic
- Automatic reservation expiry

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## 📋 Development Roadmap

- [x] Project structure initialization
- [ ] Backend foundation
- [ ] Database setup
- [ ] Authentication system
- [ ] Product catalog
- [ ] Reservation engine
- [ ] Order management
- [ ] Invoicing system
- [ ] Admin panel
- [ ] Testing & polish

## 🤝 Contributing

This is a hackathon project. Follow the guidelines in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions, check:
1. [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Architecture documentation in `00_PRD/`
3. Implementation guides in `04_PROMPTS/`

---

**Built with ❤️ for the Odoo Hackathon**
