import React from 'react';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Rently</h3>
          <p>Your trusted platform for finding roommates and rental properties across Canada.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="LinkedIn">💼</a>
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

      <style>{`
        .main-footer {
          background: linear-gradient(135deg, #2d3436 0%, #1e272e 100%);
          color: white;
          padding: 60px 20px 20px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-section h3 {
          font-size: 1.8rem;
          margin: 0 0 15px 0;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-section h4 {
          font-size: 1.1rem;
          margin: 0 0 20px 0;
          font-weight: 600;
        }

        .footer-section p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section ul li {
          margin-bottom: 12px;
        }

        .footer-section ul li a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-section ul li a:hover {
          color: #ff6b9d;
        }

        .social-links {
          display: flex;
          gap: 15px;
          font-size: 1.5rem;
        }

        .social-links a {
          transition: transform 0.3s ease;
          display: inline-block;
        }

        .social-links a:hover {
          transform: translateY(-3px);
        }

        .footer-bottom {
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 30px;
          text-align: center;
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .main-footer {
            padding: 40px 20px 20px;
            margin-top: 60px;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .footer-section h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
