import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    userEmail: string | null;
    userName: string | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string) => Promise<{ success: boolean; message?: string }>;
    adminLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Check local storage on load
        const storedEmail = localStorage.getItem('advanx_user_email');
        const storedName = localStorage.getItem('advanx_user_name');
        const storedAdmin = localStorage.getItem('advanx_is_admin');

        if (storedAdmin === 'true') {
            setIsAdmin(true);
        }
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
        if (storedName) {
            setUserName(storedName);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string) => {
        try {
            setIsLoading(true);

            // Check if this is the admin email
            const ADMIN_EMAIL = 'gt.rafaa@gmail.com';
            if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                setUserEmail(email);
                setUserName('Administrador');
                setIsAdmin(true);
                localStorage.setItem('advanx_user_email', email);
                localStorage.setItem('advanx_user_name', 'Administrador');
                localStorage.setItem('advanx_is_admin', 'true');
                return { success: true };
            }

            // Call the RPC function to check access for regular users
            const { data: isAllowed, error } = await supabase.rpc('check_user_access', {
                email_input: email,
            });

            if (error) {
                console.error('Login error:', error);
                return { success: false, message: 'Erro ao verificar credenciais.' };
            }

            if (isAllowed) {
                // Fetch user name
                const { data: clientData } = await supabase
                    .from('clientes')
                    .select('nome')
                    .eq('email', email)
                    .single();

                const name = clientData?.nome || email.split('@')[0];

                setUserEmail(email);
                setUserName(name);
                localStorage.setItem('advanx_user_email', email);
                localStorage.setItem('advanx_user_name', name);
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
        setUserName(null);
        setIsAdmin(false);
        localStorage.removeItem('advanx_user_email');
        localStorage.removeItem('advanx_user_name');
        localStorage.removeItem('advanx_is_admin');
    };

    return (
        <AuthContext.Provider value={{ userEmail, userName, isAdmin, isLoading, login, adminLogin, logout }}>
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
