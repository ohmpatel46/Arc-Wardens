import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode"; // Correct import for named export

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Set header for all axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                if (token.startsWith('mock_token_')) {
                    // Handle mock token
                    const parts = token.split('_');
                    setUser({
                        name: 'Dev User',
                        email: 'dev@example.com',
                        picture: null,
                        sub: parts[2] || 'dev'
                    });
                } else {
                    const decoded = jwtDecode(token);
                    setUser({
                        name: decoded.name,
                        email: decoded.email,
                        picture: decoded.picture,
                        sub: decoded.sub
                    });
                }
            } catch (e) {
                console.error("Invalid token", e);
                localStorage.removeItem('auth_token');
                setToken(null);
                setUser(null);
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = (credentialResponse) => {
        const t = credentialResponse.credential;
        localStorage.setItem('auth_token', t);
        setToken(t);
        // We could also call backend /api/auth/google here to sync user,
        // but the interceptor/header+first request will handle it via get_current_user dependency
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
