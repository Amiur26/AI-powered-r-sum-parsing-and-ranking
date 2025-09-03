// FIX: Import useEffect from React
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PopupController = ({ showAccessDeniedPopup, setShowAccessDeniedPopup }) => {
    const location = useLocation();

    // Effect to close popup when navigating away from /dashboard
    useEffect(() => {
        if (location.pathname !== '/dashboard' && showAccessDeniedPopup) {
            setShowAccessDeniedPopup(false);
        }
    }, [location.pathname, showAccessDeniedPopup, setShowAccessDeniedPopup]);

    return null;
};

export default PopupController;
