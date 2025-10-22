# Reelty Frontend

React frontend application for the Reelty property management platform.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

### Build
```bash
npm run build
```

## 📋 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🎨 Features

- **User Type Selection**: Choose between Student and Landlord accounts
- **Authentication**: Login and registration forms
- **Responsive Design**: Works on all device sizes
- **Modern UI**: Beautiful gradient design with animations
- **Form Validation**: Client-side validation with error handling
- **Social Login**: Google and Facebook integration (demo)

## 🛠️ Tech Stack

- React 18
- CSS3 with custom properties
- Modern JavaScript (ES6+)
- Responsive design principles

## 📁 Project Structure

```
src/
├── components/
│   ├── UserTypeSelection.js    # User type selection
│   ├── LoginForm.js            # Login forms
│   └── SignupForm.js           # Registration forms
├── App.js                      # Main app component
├── App.css                     # Main styles
├── index.js                    # Entry point
└── index.css                   # Global styles
```

## 🔗 API Integration

The frontend connects to the backend API running on `http://localhost:5000`:

- Authentication endpoints
- User profile management
- Property listings
- Search and filtering

## 🎯 Development Notes

- Uses React hooks for state management
- Component-based architecture
- CSS custom properties for theming
- Form validation and error handling
- Responsive design with mobile-first approach