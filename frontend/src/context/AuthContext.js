import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('abac_user');
        return u ? JSON.parse(u) : null;
    });
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('abac_token', data.token);
        localStorage.setItem('abac_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const register = async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        localStorage.setItem('abac_token', data.token);
        localStorage.setItem('abac_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('abac_token');
        localStorage.removeItem('abac_user');
        setUser(null);
    };

    const refreshUser = async () => {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('abac_user', JSON.stringify(data.user));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
