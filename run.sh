#!/bin/bash

# Rental ERP - One-Click Startup Script

echo "🚀 Starting Rental ERP System..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    npm install --workspaces
fi

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

# Start the application
echo "🎯 Starting backend and frontend..."
npm run dev
