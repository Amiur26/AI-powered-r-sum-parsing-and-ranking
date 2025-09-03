import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from './api';
import { ACCESS_TOKEN, REFRESH_TOKEN, GOOGLE_ACCESS_TOKEN } from './token';

const AuthContext = createContext({
    isAuthorized: false,
    user: null,
    login: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);  // Fixed here
    const [user, setUser] = useState(null);

    const checkAuth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN);

        if (token) {
            try {
                const decoded = jwtDecode(token);
                const tokenExpiration = decoded.exp;
                const now = Date.now() / 1000;

                if (tokenExpiration < now) {
                    await refreshToken();
                } else {
                    setIsAuthorized(true);
                    setUser(decoded);
                }
            } catch {
                logout();
            }
        } else if (googleAccessToken) {
            try {
                const isValid = await validateGoogleToken(googleAccessToken);
                setIsAuthorized(isValid);
            } catch {
                logout();
            }
        } else {
            logout();
        }
    };

    const refreshToken = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post('/api/token/refresh/', { refresh });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            const decoded = jwtDecode(res.data.access);
            setIsAuthorized(true);
            setUser(decoded);
            return true;
        } catch {
            logout();
            return false;
        }
    };

    const validateGoogleToken = async (googleAccessToken) => {
        try {
            const res = await api.post('/api/google/validate_token/', { access_token: googleAccessToken });
            return res.data.valid;
        } catch {
            return false;
        }
    };

    const login = async (credentials) => {
        try {
            let res;
            if (credentials.google_token) {
                res = await api.post('/api/google/login/', { access_token: credentials.google_token });
            } else {
                res = await api.post('/api/token/', credentials);
            }

            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            if (res.data.refresh) {
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            }

            await checkAuth();
            return true;
        } catch {
            logout();
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem(GOOGLE_ACCESS_TOKEN);
        setIsAuthorized(false);
        setUser(null);
    };

    useEffect(() => {
        checkAuth();
        const interval = setInterval(checkAuth, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthorized, user, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
