# Reelty Project Structure

This is a monorepo containing the frontend, backend, and shared code for the Reelty property management platform.

## 📁 Project Structure

```
Reelty-Project/
├── 📁 frontend/                 # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/       # React components
│   │   ├── 📁 pages/           # Page components
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 services/        # API services
│   │   ├── 📁 utils/           # Frontend utilities
│   │   └── 📁 styles/          # CSS/styling files
│   ├── 📄 package.json
│   └── 📄 README.md
│
├── 📁 backend/                  # Node.js/Express backend API
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Route controllers
│   │   ├── 📁 models/          # Database models
│   │   ├── 📁 routes/          # API routes
│   │   ├── 📁 middleware/      # Express middleware
│   │   ├── 📁 services/        # Business logic services
│   │   ├── 📁 utils/           # Backend utilities
│   │   └── 📁 config/          # Configuration files
│   ├── 📁 tests/               # Backend tests
│   ├── 📄 package.json
│   └── 📄 README.md
│
├── 📁 shared/                   # Shared code between frontend/backend
│   ├── 📁 types/               # TypeScript type definitions
│   ├── 📁 constants/           # Shared constants
│   ├── 📁 utils/               # Shared utility functions
│   └── 📁 validators/          # Shared validation schemas
│
├── 📁 docs/                     # Project documentation
├── 📄 package.json             # Root package.json (monorepo config)
└── 📄 README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (>=16.0.0)
- npm (>=8.0.0)

### Installation

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start development servers:**
```bash
npm run dev
```

This will start both frontend (port 3000) and backend (port 5000) simultaneously.

### Individual Commands

**Frontend only:**
```bash
npm run dev:frontend
```

**Backend only:**
```bash
npm run dev:backend
```

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both frontend and backend
- `npm run test` - Run tests for both frontend and backend
- `npm run install:all` - Install dependencies for all packages
- `npm run clean` - Clean all node_modules

### Frontend
- `npm run dev:frontend` - Start React development server
- `npm run build:frontend` - Build React app for production

### Backend
- `npm run dev:backend` - Start Express server with nodemon
- `npm run build:backend` - Build backend (if needed)

## 🔧 Development

### Frontend Development
- React 18 with modern hooks
- Component-based architecture
- Responsive design with CSS modules
- Form validation and state management

### Backend Development
- Express.js REST API
- MongoDB with Mongoose (planned)
- JWT authentication
- Rate limiting and security middleware
- Comprehensive error handling

### Shared Code
- Type definitions
- Validation schemas
- Common utilities
- Constants and enums

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Properties
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property

## 🛠️ Tech Stack

### Frontend
- React 18
- CSS3 with custom properties
- Modern JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose (planned)
- JWT for authentication
- bcryptjs for password hashing

### Development Tools
- Concurrently for running multiple servers
- Nodemon for backend development
- ESLint for code linting
- Jest for testing

## 📝 Next Steps

1. Set up MongoDB database
2. Implement user authentication
3. Add property management features
4. Implement file upload for property images
5. Add real-time notifications
6. Implement search and filtering
7. Add payment integration
8. Deploy to production

## 🤝 Contributing

1. Create feature branches from `main`
2. Follow the established folder structure
3. Write tests for new features
4. Update documentation as needed
5. Submit pull requests for review
