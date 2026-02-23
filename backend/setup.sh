#!/bin/bash

# Create main project
mkdir -p smile-ride-platform
cd smile-ride-platform

# Backend structure
mkdir -p backend/src/{config,controllers,middleware,models,routes,services,utils}
mkdir -p backend/{tests,uploads}
touch backend/src/app.js
touch backend/{.env,.env.example,package.json,Dockerfile}

# Admin dashboard structure
mkdir -p admin-dashboard/src/{components/{Layout,Dashboard,Users,Rides,Map,Common},pages,hooks,context,utils}
mkdir -p admin-dashboard/public
touch admin-dashboard/src/{App.jsx,index.js,index.css}
touch admin-dashboard/{package.json,tailwind.config.js,.env,Dockerfile}

# Database
mkdir -p database
touch database/schema.sql

# Root files
touch docker-compose.yml README.md .gitignore

echo "✅ Smile Ride Platform structure created!"
echo ""
echo "Next steps:"
echo "1. cd smile-ride-platform"
echo "2. Copy code into each file"
echo "3. docker-compose up -d postgres redis"
echo "4. cd backend && npm install && npm run dev"
echo "5. cd admin-dashboard && npm install && npm start"