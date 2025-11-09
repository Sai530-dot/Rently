# 🏠 Rently - AI-Powered Rental Platform

An intelligent property rental platform featuring AI image analysis, ML-powered offer evaluation, interactive maps, and smart roommate matching.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

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

## ✨ Key Features

### 🤖 AI-Powered Image Analysis
- Automatic property image quality scoring (0-100)
- Feature detection (appliances, finishes, amenities)
- Room condition analysis
- Cleanliness, lighting, and maintenance scoring
- AI-detected highlights displayed on property cards
- Confidence levels for all analyses

### 📊 Enhanced Offer Evaluation (ML Model v2.0)
- Analyzes 15+ parameters including:
  - Price per sqft analysis
  - Location quality scoring
  - Building age and condition
  - Security features assessment
  - Amenities evaluation
- Market comparison with real-time data
- Value and quality scores
- Comprehensive recommendations
- Actionable next steps

### 🗺️ Interactive Maps
- Real Leaflet maps with OpenStreetMap tiles
- Color-coded rent price markers
- Interactive popups with property details
- Province filtering
- Tab switching between list and map views
- Drag, zoom, and explore functionality

### 🏠 Property Management
- Advanced filtering (price, bedrooms, amenities)
- Save/unsave properties with localStorage persistence
- Contact landlord with inbox integration
- Property details modal
- Real-time property search

### 💬 Communication
- Messages inbox with conversation threading
- Contact landlord feature
- Message persistence across sessions
- Pre-filled message templates

### 👥 Smart Roommate Matching
- Lifestyle compatibility scoring
- Budget alignment
- Sleep schedule matching
- Cleanliness preferences
- Social compatibility

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern hooks and component architecture
- **Leaflet.js** - Interactive maps with OpenStreetMap
- **CSS3** - Custom properties, gradients, animations
- **LocalStorage** - Client-side data persistence
- **Modern JavaScript (ES6+)**

### Backend
- **Node.js & Express.js** - RESTful API server
- **AI Image Analysis Service** - Custom ML service
- **Offer Evaluation ML Model** - Property valuation algorithm
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### Development Tools
- **Concurrently** - Run multiple servers
- **Nodemon** - Auto-restart on changes
- **ESLint** - Code quality
- **Git** - Version control

## 🤝 Contributing

1. Create feature branches from `main`
2. Follow the established folder structure
3. Write tests for new features
4. Update documentation as needed
5. Submit pull requests for review
