import React, { useState } from 'react';

const ProfileSetup = ({ onContinue, onBack, userType }) => {
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      alert('Please enter your first name');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onContinue(firstName.trim());
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e) => {
    setFirstName(e.target.value);
  };

  return (
    <div className="profile-setup-container">
      {/* Close/Back Button */}
      <button className="close-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      {/* Main Content */}
      <div className="profile-setup-content">
        <h1 className="setup-title">My first name is</h1>
        
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="input-container">
            <input
              type="text"
              value={firstName}
              onChange={handleInputChange}
              placeholder="Ivan"
              className="name-input"
              autoFocus
            />
          </div>
          
          <p className="input-hint">
            This is how it will appear in {userType === 'student' ? 'Reelty' : 'Reelty'}.
          </p>
          
          <button 
            type="submit" 
            className="continue-button"
            disabled={isLoading || !firstName.trim()}
          >
            {isLoading ? 'CONTINUING...' : 'CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
