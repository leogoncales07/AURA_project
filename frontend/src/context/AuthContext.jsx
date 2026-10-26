'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, saveSession, clearSession } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ['/login', '/signup', '/', '/demo', '/reset-password', '/privacy', '/terms'];

export function AuthProvider({ children }) {
    const { setTheme } = useTheme();
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
        window.addEventListener('aura:session', syncFromStorage);
        return () => window.removeEventListener('aura:session', syncFromStorage);
    }, [syncFromStorage]);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        Promise.all([api.getUser(), api.getUserSettings()]).then(([profile, preferences]) => {
            if (cancelled) return;
            if (preferences.data?.data) {
                const settings = preferences.data.data;
                setTheme(settings.theme);
                if (/^#[0-9a-fA-F]{6}$/.test(settings.accent_color || '')) {
                    document.documentElement.style.setProperty('--brand-primary', settings.accent_color);
                    localStorage.setItem('aura_accent', settings.accent_color);
                }
            }
            if (profile.data?.data) {
                const updated = profile.data.data;
                setUser(previous => {
                    if (!previous || previous.id !== updated.id) return previous;
                    const merged = { ...previous, ...updated };
                    const storage = localStorage.getItem('aura_token') ? localStorage : sessionStorage;
                    storage.setItem('aura_user', JSON.stringify(merged));
                    return merged;
                });
            }
        });
        return () => { cancelled = true; };
    }, [user?.id, setTheme]);

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

        if (data?.access_token && data.user) {
            const userData = { ...data.user, ...data.user.user_metadata, name: data.user.user_metadata?.display_name || data.user.user_metadata?.name || data.user.email };
            saveSession({ ...data, user: userData }, rememberMe);
            setToken(data.access_token);
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

        if (data?.confirmation_required) return { confirmationRequired: true };
        if (data?.access_token && data.user) {
            const userData = { ...data.user, ...data.user.user_metadata, name };
            saveSession({ ...data, user: userData }, true);
            setToken(data.access_token);
            setUser(userData);
            router.push('/dashboard');
            return { data };
        }

        return { error: 'Failed to create account' };
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            void api.logout();
            clearSession();
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
