import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

// Initialize axios headers immediately from localStorage to prevent 401 race conditions
const initialToken = localStorage.getItem('auth_token');
const initialAccessToken = localStorage.getItem('access_token');
if (initialToken) axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
if (initialAccessToken) axios.defaults.headers.common['X-Google-AccessToken'] = initialAccessToken;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(initialToken);
    const [accessToken, setAccessToken] = useState(initialAccessToken);
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('auth_user') || 'null');
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Interceptor for dynamic token updates
        const interceptor = axios.interceptors.request.use((config) => {
            const currentToken = localStorage.getItem('auth_token');
            const currentAccessToken = localStorage.getItem('access_token');

            if (currentToken) {
                config.headers['Authorization'] = `Bearer ${currentToken}`;
            }
            if (currentAccessToken) {
                config.headers['X-Google-AccessToken'] = currentAccessToken;
            }
            return config;
        });

        setLoading(false);
        return () => axios.interceptors.request.eject(interceptor);
    }, []);

    const login = (credentialResponse, gAccessToken, userInfo = null) => {
        const idToken = credentialResponse?.credential;

        if (idToken) {
            localStorage.setItem('auth_token', idToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
            setToken(idToken);
        }

        if (gAccessToken) {
            localStorage.setItem('access_token', gAccessToken);
            axios.defaults.headers.common['X-Google-AccessToken'] = gAccessToken;
            setAccessToken(gAccessToken);
        }

        if (userInfo) {
            const userData = {
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                sub: userInfo.sub || userInfo.id
            };
            localStorage.setItem('auth_user', JSON.stringify(userData));
            setUser(userData);
        }
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['X-Google-AccessToken'];
        setToken(null);
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, accessToken, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
