# Reelty Backend API

Express.js backend API for the Reelty property management platform.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📋 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server health status

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

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/reelty
JWT_SECRET=your-jwt-secret-key
```

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose (planned)
- JWT authentication
- bcryptjs for password hashing
- Express rate limiting
- Helmet for security
- CORS for cross-origin requests
