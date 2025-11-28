import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const MemberLayout = () => {
    const { logout, userEmail } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#0f1419]">
            {/* Header */}
            <header className="bg-[#1a1f2e] border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <img
                            src="https://lhbwfbquxkutcyqazpnw.supabase.co/storage/v1/object/public/images/logo/v3%20png.webp"
                            alt="Advanx Academy"
                            className="h-8 w-auto"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400 hidden sm:block">{userEmail}</span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
                            title="Sair"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default MemberLayout;
