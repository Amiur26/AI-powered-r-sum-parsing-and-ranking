/* eslint-disable no-unused-vars */
import React, { useState } from "react";
// Import useLocation and useEffect for PopupController, but not directly in App
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import './index.css';
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import About from "./pages/About";
import AuthPage from "./pages/AuthPage";
import { useAuth, AuthProvider } from "./auth";
import RedirectGoogleAuth from "./components/GoogleRedirectHandler";

// NEW IMPORTS
import WhyUs from "./components/WhyUs"; // Import WhyUs component
import DashboardWrapper from "./components/DashboardWrapper"; // Import DashboardWrapper
import AccessDeniedPopup from "./components/AccessDeniedPopup"; // Import AccessDeniedPopup
import Dashboard from "./pages/Dashboard"; // Import Dashboard (the actual content)
import PopupController from "./components/PopupController"; // Import PopupController

function App() {
    // State to control the visibility of the access denied popup
    const [showAccessDeniedPopup, setShowAccessDeniedPopup] = useState(false);

    // Handlers to open and close the popup
    const handleOpenAccessDeniedPopup = () => {
        setShowAccessDeniedPopup(true);
    };

    const handleCloseAccessDeniedPopup = () => {
        setShowAccessDeniedPopup(false);
    };

    // Protected routes logic
    const ProtectedLogin = () => {
        const { isAuthorized } = useAuth(); // Call useAuth inside the component
        return isAuthorized ? <Navigate to='/dashboard' /> : <AuthPage initialMethod='login' />;
    };

    const ProtectedRegister = () => {
        const { isAuthorized } = useAuth(); // Call useAuth inside the component
        return isAuthorized ? <Navigate to='/' /> : <AuthPage initialMethod='register' />;
    };

    return (
        // AuthProvider must wrap BrowserRouter or the components that use useAuth
        <AuthProvider>
            <div>
                <BrowserRouter>
                    {/* Render the PopupController inside BrowserRouter
                        It will use useLocation and useEffect to manage popup state */}
                    <PopupController
                        showAccessDeniedPopup={showAccessDeniedPopup}
                        setShowAccessDeniedPopup={setShowAccessDeniedPopup}
                    />

                    <Navbar /> {/* Navbar is rendered outside Routes if it's always visible */}
                    <Routes>
                        <Route path="/login/callback" element={<RedirectGoogleAuth />} />
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                        <Route path="/register" element={<ProtectedRegister />} />
                        <Route path="/login" element={<ProtectedLogin />} />
                        <Route path="/about" element={<About />} />

                        {/* Route for the WhyUs component */}
                        <Route path="/why" element={<WhyUs />} />
                         
                        {/* Dashboard route uses DashboardWrapper to handle access */}
                        <Route
                            path="/dashboard"
                            element={<DashboardWrapper onAccessDenied={handleOpenAccessDeniedPopup} />}
                        />
                    </Routes>

                    {/* Render the Access Denied Popup. It will be shown/hidden based on showAccessDeniedPopup state */}
                    <AccessDeniedPopup
                        isOpen={showAccessDeniedPopup}
                        onClose={handleCloseAccessDeniedPopup}
                    />
                </BrowserRouter>
            </div>
        </AuthProvider>
    );
}

export default App;
