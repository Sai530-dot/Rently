import React, { useState } from 'react';

const SignupForm = ({ userType, onBack, onShowLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    university: '',
    company: '',
    terms: false
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
    const requiredFields = ['name', 'email', 'password', 'confirmPassword'];
    if (userType === 'landlord-signup') {
      requiredFields.push('phone');
    } else {
      requiredFields.push('university');
    }

    for (const field of requiredFields) {
      if (!formData[field]) {
        alert('Please fill in all required fields');
        return;
      }
    }

    if (!formData.terms) {
      alert('Please agree to the Terms & Conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Phone number validation for landlords
    if (userType === 'landlord-signup') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        alert('Please enter a valid phone number');
        return;
      }
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const userTypeName = userType.replace('-signup', '');
      alert(`${userTypeName.charAt(0).toUpperCase() + userTypeName.slice(1)} account created successfully! (This is a demo)`);
      setIsLoading(false);
      onShowLogin();
    }, 1500);
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    alert('Terms & Conditions would be displayed here');
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    onShowLogin();
  };

  const isStudentSignup = userType === 'student-signup';
  const userTypeName = userType.replace('-signup', '');

  return (
    <div className="login-form-container">
      <div className="welcome-text">
        <h2>Create {userTypeName.charAt(0).toUpperCase() + userTypeName.slice(1)} Account</h2>
        <p>
          {isStudentSignup 
            ? 'Join us to find your perfect home' 
            : 'Start renting out your properties'
          }
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
          />
        </div>

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

        {isStudentSignup ? (
          <div className="form-group">
            <label htmlFor="university">University/School</label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              placeholder="Enter your university or school"
              required
            />
          </div>
        ) : (
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
            placeholder="Create a password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            required
          />
        </div>

        {!isStudentSignup && (
          <div className="form-group">
            <label htmlFor="company">Company/Property Management</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Enter your company name (optional)"
            />
          </div>
        )}

        <div className="form-options">
          <div className="remember-me">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="terms">
              I agree to the{' '}
              <a href="#" onClick={handleTermsClick} style={{ color: 'var(--tinder-red)' }}>
                Terms & Conditions
              </a>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : `Create ${userTypeName.charAt(0).toUpperCase() + userTypeName.slice(1)} Account`}
        </button>
      </form>

      <div className="back-button-container">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Selection
        </button>
      </div>

      <div className="signup-link">
        Already have an account?{' '}
        <a href="#" onClick={handleLoginClick}>
          Log in here
        </a>
      </div>
    </div>
  );
};

export default SignupForm;
