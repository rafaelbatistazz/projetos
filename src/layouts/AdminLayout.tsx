import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Layers,
    PlayCircle,
    Users,
    Settings as SettingsIcon,
    LogOut,
    Menu,
    X,
    Lock as LockIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

const AdminLayout = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/courses', icon: BookOpen, label: 'Cursos' },
        { path: '/admin/modules', icon: Layers, label: 'Módulos' },
        { path: '/admin/lessons', icon: PlayCircle, label: 'Aulas' },
        { path: '/admin/clients', icon: Users, label: 'Clientes' },
        { path: '/admin/course-access', icon: LockIcon, label: 'Gerenciar Acessos' },
        { path: '/admin/settings', icon: SettingsIcon, label: 'Configurações' },
    ];

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1a1f2e] border-r border-gray-700 transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://lhbwfbquxkutcyqazpnw.supabase.co/storage/v1/object/public/images/logo/v3%20png.webp"
                            alt="Advanx Academy"
                            className="h-8 w-auto"
                        />
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive(item.path, item.exact)
                                    ? "bg-primary text-white shadow-lg shadow-primary/50"
                                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0f1419]">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-[#1a1f2e] border-b border-gray-700 flex items-center px-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-400 hover:text-white focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-4 text-lg font-medium text-white">Menu</span>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
