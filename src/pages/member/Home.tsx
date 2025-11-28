import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Course = Database['public']['Tables']['courses']['Row'];

const Home = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const [bannerConfig, setBannerConfig] = useState({
        url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop',
        title: 'Bem vindo à Advanx Academy',
        subtitle: 'Domine novas habilidades e alcance seus objetivos com nossos cursos exclusivos.'
    });

    useEffect(() => {
        fetchCourses();
        fetchBannerConfig();
    }, []);

    const fetchBannerConfig = async () => {
        try {
            const { data } = await supabase.from('site_config').select('*');
            if (data) {
                const newConfig = { ...bannerConfig };
                data.forEach((item: any) => {
                    if (item.key === 'banner_url') newConfig.url = item.value;
                    if (item.key === 'banner_title') newConfig.title = item.value;
                    if (item.key === 'banner_subtitle') newConfig.subtitle = item.value;
                });
                setBannerConfig(newConfig);
            }
        } catch (error) {
            console.error('Error fetching banner config:', error);
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
                        {courses.map((course) => (
                            <motion.div
                                key={course.id}
                                variants={item}
                                onClick={() => navigate(`/course/${course.id}`)}
                                className="group cursor-pointer bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="text-xl font-bold text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        {/* Progress bar placeholder */}
                                        <div className="w-full bg-gray-700/50 h-1 rounded-full mt-2 overflow-hidden backdrop-blur-sm">
                                            <div className="bg-primary h-full rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Home;
