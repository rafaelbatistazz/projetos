import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Instagram, Facebook, Linkedin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MemberLayout = () => {
    const { logout, userName } = useAuth();
    const navigate = useNavigate();
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        facebook: '',
        linkedin: '',
        tiktok: ''
    });

    useEffect(() => {
        fetchSocialLinks();
    }, []);

    const fetchSocialLinks = async () => {
        try {
            const { data } = await supabase
                .from('site_config')
                .select('*')
                .in('key', ['social_instagram', 'social_facebook', 'social_linkedin', 'social_tiktok']);

            if (data) {
                const links = { ...socialLinks };
                data.forEach((item: any) => {
                    if (item.key === 'social_instagram') links.instagram = item.value;
                    if (item.key === 'social_facebook') links.facebook = item.value;
                    if (item.key === 'social_linkedin') links.linkedin = item.value;
                    if (item.key === 'social_tiktok') links.tiktok = item.value;
                });
                setSocialLinks(links);
            }
        } catch (error) {
            console.error('Error fetching social links:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <img
                                src="https://lhbwfbquxkutcyqazpnw.supabase.co/storage/v1/object/public/images/logo/v3%20png.webp"
                                alt="Advanx Academy"
                                className="h-8 w-auto"
                            />
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {socialLinks.instagram && (
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.facebook && (
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.linkedin && (
                                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.tiktok && (
                                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    {/* Custom TikTok Icon or generic Link */}
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400 hidden sm:block font-medium">
                            {userName || 'Membro'}
                        </span>
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
