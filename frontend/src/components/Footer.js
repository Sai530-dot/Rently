import React from 'react';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content-wrapper">
        <div className="footer-container">
          <div className="footer-section brand-section">
            <h3>Rently</h3>
            <p>Your trusted platform for finding roommates and rental properties across Canada.</p>
            <div className="social-links">
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="social-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" aria-label="Twitter" className="social-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="social-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">How It Works</a></li>
              <li><a href="#">Safety Tips</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>For Students</h4>
            <ul>
              <li><a href="#">Find Roommates</a></li>
              <li><a href="#">Browse Properties</a></li>
              <li><a href="#">Rent Calculator</a></li>
              <li><a href="#">Student Resources</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Rently. All rights reserved. Made for students across Canada.</p>
        </div>
      </div>

      <style>{`
        .main-footer {
          background: linear-gradient(135deg, #2d3436 0%, #1e272e 100%);
          color: white;
          padding: 40px 20px 20px;
          margin-top: 120px;
          margin-left: -85px; 
          width: calc(100% + 85px); 
          position: relative;
          z-index: 10;
        }

        .footer-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .footer-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-section h3 {
          font-size: 1.6rem;
          margin: 0 0 15px 0;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-section h4 {
          font-size: 0.95rem;
          margin: 0 0 15px 0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #dfe6e9;
        }

        .footer-section p {
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
          font-size: 0.9rem;
          margin-bottom: 20px;
          max-width: 280px;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section ul li {
          margin-bottom: 10px;
        }

        .footer-section ul li a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .footer-section ul li a:hover {
          color: #ff6b9d;
          padding-left: 5px;
        }

        /* --- Social Icons (Pinterest Style) --- */
        .social-links {
          display: flex;
          gap: 12px;
        }

        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .social-icon svg {
          width: 20px;
          height: 20px;
        }

        .social-icon:hover {
          background-color: #fd5068;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(253, 80, 104, 0.4);
          border-color: transparent;
        }

        .footer-bottom {
          padding-top: 20px;
          text-align: center;
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
          margin: 0;
        }

        @media (max-width: 900px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        /* === MOBILE OVERRIDE: HIDE FOOTER === */
        @media (max-width: 768px) {
          .main-footer {
             display: none;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;