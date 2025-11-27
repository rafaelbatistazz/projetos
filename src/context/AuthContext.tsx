import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    userEmail: string | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<{ success: boolean; message?: string }>;
    adminLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // We can't use useNavigate here directly if AuthProvider is outside Router. 
    // But usually it is inside. We'll assume it is inside or handle redirect in components.
    // Actually, better to not couple navigation here if possible, but the prompt says "redirect".
    // I'll leave navigation to the calling component to avoid Router context issues if AuthProvider is high up.

    useEffect(() => {
        // Check local storage on load
        const storedEmail = localStorage.getItem('advanx_user_email');
        const storedAdmin = localStorage.getItem('advanx_is_admin');

        if (storedAdmin === 'true') {
            setIsAdmin(true);
        }
        if (storedEmail) {
            // Optionally re-validate with DB here, but for MVP we trust local storage or re-validate silently
            setUserEmail(storedEmail);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string) => {
        try {
            setIsLoading(true);
            // Call the RPC function to check access
            const { data: isAllowed, error } = await supabase.rpc('check_user_access', {
                email_input: email,
            });

            if (error) {
                console.error('Login error:', error);
                return { success: false, message: 'Erro ao verificar credenciais.' };
            }

            if (isAllowed) {
                setUserEmail(email);
                localStorage.setItem('advanx_user_email', email);
                return { success: true };
            } else {
                return { success: false, message: 'Email não autorizado ou acesso inativo.' };
            }
        } catch (err) {
            console.error('Unexpected login error:', err);
            return { success: false, message: 'Erro inesperado.' };
        } finally {
            setIsLoading(false);
        }
    };

    const adminLogin = async (password: string) => {
        // Hardcoded password as requested (in env or fixed)
        const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'; // Fallback for dev

        if (password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            localStorage.setItem('advanx_is_admin', 'true');
            return { success: true };
        } else {
            return { success: false, message: 'Senha incorreta.' };
        }
    };

    const logout = () => {
        setUserEmail(null);
        setIsAdmin(false);
        localStorage.removeItem('advanx_user_email');
        localStorage.removeItem('advanx_is_admin');
    };

    return (
        <AuthContext.Provider value={{ userEmail, isAdmin, isLoading, login, adminLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
