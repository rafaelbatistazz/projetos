import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { BookOpen, Loader2, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

type Course = Database['public']['Tables']['courses']['Row'];

const Home = () => {
    const navigate = useNavigate();
    const { userEmail } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseAccess, setCourseAccess] = useState<Set<string>>(new Set());
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [lockedCourseTitle, setLockedCourseTitle] = useState('');
    const [ctaConfig, setCtaConfig] = useState({
        message: 'Este curso não está disponível no seu plano atual.',
        buttonText: 'Falar com Suporte',
        buttonUrl: 'https://wa.me/5511999999999'
    });

    const [bannerConfig, setBannerConfig] = useState({
        url: '',
        title: '',
        subtitle: ''
    });
    const [bannerLoading, setBannerLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
        fetchBannerConfig();
        fetchCtaConfig();
        if (userEmail) {
            fetchCourseAccess();
        }
    }, [userEmail]);

    const fetchCourseAccess = async () => {
        if (!userEmail) return;
        try {
            const { data } = await supabase
                .from('course_access')
                .select('course_id')
                .eq('email', userEmail)
                .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

            if (data) {
                setCourseAccess(new Set(data.map(a => a.course_id)));
            }
        } catch (error) {
            console.error('Error fetching course access:', error);
        }
    };

    const fetchCtaConfig = async () => {
        try {
            const { data } = await supabase
                .from('site_config')
                .select('*')
                .in('key', ['locked_course_message', 'locked_course_button_text', 'locked_course_button_url']);

            if (data) {
                const newConfig = { ...ctaConfig };
                data.forEach((item: any) => {
                    if (item.key === 'locked_course_message' && item.value) newConfig.message = item.value;
                    if (item.key === 'locked_course_button_text' && item.value) newConfig.buttonText = item.value;
                    if (item.key === 'locked_course_button_url' && item.value) newConfig.buttonUrl = item.value;
                });
                setCtaConfig(newConfig);
            }
        } catch (error) {
            console.error('Error fetching CTA config:', error);
        }
    };

    const fetchBannerConfig = async () => {
        setBannerLoading(true);
        try {
            const { data } = await supabase.from('site_config').select('*');
            if (data) {
                const newConfig = {
                    url: '',
                    title: '',
                    subtitle: ''
                };
                data.forEach((item: any) => {
                    if (item.key === 'banner_url' && item.value) newConfig.url = item.value;
                    if (item.key === 'banner_title' && item.value) newConfig.title = item.value;
                    if (item.key === 'banner_subtitle' && item.value) newConfig.subtitle = item.value;
                });
                // Only update if we have at least a URL
                if (newConfig.url) {
                    setBannerConfig(newConfig);
                } else {
                    // Fallback to default if no config found
                    setBannerConfig({
                        url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop',
                        title: 'Bem vindo à Advanx Academy',
                        subtitle: 'Domine novas habilidades e alcance seus objetivos com nossos cursos exclusivos.'
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching banner config:', error);
            // Fallback on error
            setBannerConfig({
                url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop',
                title: 'Bem vindo à Advanx Academy',
                subtitle: 'Domine novas habilidades e alcance seus objetivos com nossos cursos exclusivos.'
            });
        } finally {
            setBannerLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('order_position');

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Banner Section */}
            {!bannerLoading && bannerConfig.url && (
                <div className="w-full h-[500px] relative overflow-hidden mb-12 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10 }}
                        src={bannerConfig.url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 z-20 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                            >
                                {bannerConfig.title}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed"
                            >
                                {bannerConfig.subtitle}
                            </motion.p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-white border-l-4 border-primary pl-4">Conteúdos</h2>
                </motion.div>

                {courses.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Nenhum conteúdo disponível no momento.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {courses.map((course) => {
                            const hasAccess = courseAccess.has(course.id);

                            return (
                                <motion.div
                                    key={course.id}
                                    variants={item}
                                    onClick={() => {
                                        if (hasAccess) {
                                            navigate(`/course/${course.id}`);
                                        } else {
                                            setLockedCourseTitle(course.title);
                                            setShowLockedModal(true);
                                        }
                                    }}
                                    className="group cursor-pointer bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 relative"
                                >
                                    <div className="aspect-[2/3] relative overflow-hidden">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                                <BookOpen className="h-12 w-12 text-gray-700" />
                                            </div>
                                        )}

                                        {/* Locked Overlay */}
                                        {!hasAccess && (
                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                                <Lock className="h-12 w-12 text-gray-400 mb-3" />
                                                <p className="text-sm text-gray-300 font-medium">Curso Bloqueado</p>
                                                <p className="text-xs text-gray-500 mt-1">Clique para mais info</p>
                                            </div>
                                        )}

                                        {/* Access Badge */}
                                        {hasAccess && (
                                            <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                                                ✓ LIBERADO
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Locked Course Modal */}
            <AnimatePresence>
                {showLockedModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowLockedModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1f2e] rounded-xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gray-800 rounded-full">
                                        <Lock className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Acesso Restrito</h3>
                                        <p className="text-sm text-gray-400 mt-1">{lockedCourseTitle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLockedModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <p className="text-gray-300 mb-6 leading-relaxed">
                                {ctaConfig.message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLockedModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Fechar
                                </button>
                                <a
                                    href={ctaConfig.buttonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors text-center"
                                >
                                    {ctaConfig.buttonText}
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
