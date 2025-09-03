import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AccessDeniedPopup.css';

const AccessDeniedPopup = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleCloseAndNavigateHome = () => {
        onClose(); // First, close the popup state
        navigate('/'); // Then, navigate to the home page
    };

    const handleLoginClick = () => {
        onClose(); // Close the popup
        navigate('/login'); // Redirect to login page
    };

    const handleRegisterClick = () => {
        onClose(); // Close the popup
        navigate('/register'); // Redirect to register page
    };

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                {/* Use the new handler for the close button */}
                <button className="popup-close-button" onClick={handleCloseAndNavigateHome}>&times;</button>
                <div className="lock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h2>Access Restricted</h2>
                <p>Resumely is free to use, but to access the dashboard and its powerful features, please log in or register.</p>
                <div className="popup-actions">
                    <button className="popup-button popup-login" onClick={handleLoginClick}>Log In</button>
                    <button className="popup-button popup-register" onClick={handleRegisterClick}>Register</button>
                </div>
            </div>
        </div>
    );
};

export default AccessDeniedPopup;
