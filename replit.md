# SAV Pro - Service Après-Vente Professionnel

## Overview
SAV Pro is a mobile application for after-sales service management. It enables sales representatives (commercials) to declare product issues and technicians to manage and resolve them.

## User Roles
- **Commercial**: Can create declarations for product issues, manage clients
- **Technicien**: Can view all declarations, take charge of issues, and mark them as resolved

## Project Structure
```
client/           # React Native (Expo) frontend
  ├── components/ # Reusable UI components
  ├── contexts/   # React contexts (AuthContext)
  ├── hooks/      # Custom hooks
  ├── navigation/ # Navigation structure
  ├── screens/    # App screens
  ├── types/      # TypeScript types
  └── constants/  # Theme, colors, spacing

server/           # Express.js backend
  ├── index.ts    # Server entry point
  ├── routes.ts   # API routes
  ├── auth.ts     # Authentication middleware
  └── storage.ts  # In-memory data storage

assets/           # Images and icons
```

## Tech Stack
- Frontend: React Native with Expo
- Backend: Node.js with Express
- Authentication: JWT tokens
- Storage: In-memory (MemStorage class)

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/clients` - Get commercial's clients
- `POST /api/clients` - Create new client
- `GET /api/declarations` - Get all declarations
- `POST /api/declarations` - Create new declaration
- `POST /api/declarations/:id/take` - Technician takes charge
- `POST /api/declarations/:id/resolve` - Mark as resolved
- `POST /api/upload` - Upload photo

## Running the App
- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)

## Design
- Primary Color: #E63946 (Bold red)
- Secondary Color: #457B9D (Professional blue)
- Success: #06D6A0 (Green)
- Warning: #F77F00 (Orange)
