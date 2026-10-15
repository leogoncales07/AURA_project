'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ['/login', '/signup', '/', '/demo'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Sync state from storage
    const syncFromStorage = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        const storedToken = localStorage.getItem('aura_token') || sessionStorage.getItem('aura_token');
        const storedUser = localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.warn('[AuthContext] Failed to parse user from storage');
            }
        } else {
            setToken(null);
            setUser(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        syncFromStorage();
    }, [syncFromStorage]);

    // Route guardian for protected pages
    useEffect(() => {
        if (loading) return;

        const isPublic = PUBLIC_ROUTES.includes(pathname);

        if (!user && !isPublic) {
            router.push('/login');
        } else if (user && (pathname === '/login' || pathname === '/signup')) {
            router.push('/dashboard');
        }
    }, [user, loading, pathname, router]);

    const login = async (email, password, rememberMe = false) => {
        const { data, error } = await api.login(email, password);
        if (error) {
            return { error };
        }

        if (data && (data.access_token || data.user)) {
            const accessToken = data.access_token || 'demo-token';
            const userData = data.user || { email, name: email.split('@')[0] };

            if (rememberMe) {
                localStorage.setItem('aura_token', accessToken);
                localStorage.setItem('aura_user', JSON.stringify(userData));
                sessionStorage.removeItem('aura_token');
                sessionStorage.removeItem('aura_user');
            } else {
                sessionStorage.setItem('aura_token', accessToken);
                sessionStorage.setItem('aura_user', JSON.stringify(userData));
                localStorage.removeItem('aura_token');
                localStorage.removeItem('aura_user');
            }

            setToken(accessToken);
            setUser(userData);
            router.push('/dashboard');
            return { data };
        }

        return { error: 'Invalid response from server' };
    };

    const signup = async (name, email, password) => {
        const { data, error } = await api.signup(email, password, name);
        if (error) {
            return { error };
        }

        if (data && (data.access_token || data.user)) {
            const accessToken = data.access_token || 'demo-token';
            const userData = data.user || { email, name };

            localStorage.setItem('aura_token', accessToken);
            localStorage.setItem('aura_user', JSON.stringify(userData));

            setToken(accessToken);
            setUser(userData);
            router.push('/dashboard');
            return { data };
        }

        return { error: 'Failed to create account' };
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('aura_token');
            localStorage.removeItem('aura_user');
            sessionStorage.removeItem('aura_token');
            sessionStorage.removeItem('aura_user');
        }
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    const updateUser = (updates) => {
        setUser((prev) => {
            const updated = { ...prev, ...updates };
            if (typeof window !== 'undefined') {
                if (localStorage.getItem('aura_user')) {
                    localStorage.setItem('aura_user', JSON.stringify(updated));
                } else {
                    sessionStorage.setItem('aura_user', JSON.stringify(updated));
                }
            }
            return updated;
        });
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email
        ? user.email[0].toUpperCase()
        : 'A';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!user,
                initials,
                login,
                signup,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
