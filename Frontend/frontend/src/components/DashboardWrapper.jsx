import React, { useEffect } from 'react';
import { useAuth } from '../auth'; // Assuming useAuth provides isAuthorized
// FIX: Correct the import path for Dashboard
import Dashboard from '../pages/Dashboard'; // <--- CHANGED THIS LINE
import { useNavigate } from 'react-router-dom';

const DashboardWrapper = ({ onAccessDenied }) => {
    const { isAuthorized, loading } = useAuth(); // Assuming useAuth provides a loading state

    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAuthorized) {
            onAccessDenied();
        }
    }, [isAuthorized, loading, onAccessDenied, navigate]);

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (isAuthorized) {
        return <Dashboard />; // Render the actual dashboard
    } else {
        return (
            <div className="dashboard-locked-message">
                <div className="lock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h2>Dashboard Locked</h2>
                <p>Please log in to access this section.</p>
            </div>
        );
    }
};

export default DashboardWrapper;
