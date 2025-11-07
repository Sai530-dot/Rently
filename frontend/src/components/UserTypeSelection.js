import React from 'react';

const UserTypeSelection = ({ onUserTypeSelect, onShowSignup, onBack, mode }) => {
  const handleCardClick = (type) => {
    onUserTypeSelect(type);
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    onShowSignup();
  };

  const handleBackClick = () => {
    onBack();
  };

  return (
    <div className="user-selection">
      <div className="welcome-text">
        <h2>
          {mode === 'login' ? 'ARE YOU A .....' : 'CREATE ACCOUNT'}
        </h2>
        <p>
          {mode === 'login' 
            ? 'Choose your account type to continue' 
            : 'Choose your account type to get started'
          }
        </p>
      </div>

      <div className="selection-options">
        <div 
          className="option-card" 
          onClick={() => handleCardClick(mode === 'login' ? 'student' : 'student-signup')}
        >
          <div className="option-icon">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM17 16H7V14H17V16ZM17 8H7V6H17V8Z"
              />
            </svg>
          </div>
          <h3>STUDENT</h3>
          <p>Looking for housing</p>
        </div>

        <div 
          className="option-card" 
          onClick={() => handleCardClick(mode === 'login' ? 'landlord' : 'landlord-signup')}
        >
          <div className="option-icon">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M7 14C5.9 14 5 13.1 5 12S5.9 10 7 10 9 10.9 9 12 8.1 14 7 14ZM12.6 10C11.8 7.6 9.6 6 7 6C3.7 6 1 8.7 1 12S3.7 18 7 18C9.6 18 11.8 16.4 12.6 14H16V18H20V14H23V10H12.6ZM7 16C4.8 16 3 14.2 3 12S4.8 8 7 8 11 9.8 11 12 9.2 16 7 16Z"
              />
            </svg>
          </div>
          <h3>LANDLORD</h3>
          <p>Renting out properties</p>
        </div>
      </div>

      {mode === 'signup' && (
        <div className="back-button-container">
          <button
            type="button"
            className="back-button"
            onClick={handleBackClick}
          >
            ← Back to Login
          </button>
        </div>
      )}

      {mode === 'login' && (
        <div className="signup-link">
          Don't have an account?{' '}
          <a href="#" onClick={handleSignupClick}>
            Sign up here
          </a>
        </div>
      )}
    </div>
  );
};

export default UserTypeSelection;