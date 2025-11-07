import React, { useState } from 'react';

const LoginForm = ({ userType, onBack, onShowSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (userType === 'landlord' && !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Phone number validation for landlords
    if (userType === 'landlord') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        alert('Please enter a valid phone number');
        return;
      }
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} login successful! (This is a demo)`);
      setIsLoading(false);
    }, 1500);
  };

  const handleSocialLogin = (platform) => {
    alert(`${platform} login clicked as ${userType}! (This is a demo)`);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert(`Forgot password functionality for ${userType}s would be implemented here`);
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    onShowSignup();
  };

  return (
    <div className="login-form-container">
      <div className="welcome-text">
        <h2>Welcome Back, {userType.charAt(0).toUpperCase() + userType.slice(1)}!</h2>
        <p>
          {userType === 'student' 
            ? 'Sign in to continue your property search' 
            : 'Sign in to manage your properties'
          }
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />
        </div>

        {userType === 'landlord' && (
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <div className="form-options">
          <div className="remember-me">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              checked={formData.remember}
              onChange={handleInputChange}
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          <a href="#" className="forgot-password" onClick={handleForgotPassword}>
            Forgot Password?
          </a>
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : `Sign In as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
        </button>
      </form>

      <div className="back-button-container">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to Selection
        </button>
      </div>

      <div className="divider">
        <span>or continue with</span>
      </div>

      <div className="social-login">
        <button 
          type="button" 
          className="social-button"
          onClick={() => handleSocialLogin('Google')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button 
          type="button" 
          className="social-button"
          onClick={() => handleSocialLogin('Facebook')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          Facebook
        </button>
      </div>

      <div className="signup-link">
        Don't have an account?{' '}
        <a href="#" onClick={handleSignupClick}>
          Sign up here
        </a>
      </div>
    </div>
  );
};

export default LoginForm;