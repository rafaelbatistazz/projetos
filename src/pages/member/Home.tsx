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

    useEffect(() => {
        fetchCourses();
    }, []);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-white">Meus Cursos</h1>
                <p className="mt-2 text-gray-400">Continue sua jornada de aprendizado</p>
            </motion.div>

            {courses.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400">Nenhum curso disponível no momento.</p>
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
                            onClick={() => navigate(`/member/course/${course.id}`)}
                            className="group cursor-pointer bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                        >
                            <div className="aspect-[2/3] relative overflow-hidden">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <BookOpen className="h-12 w-12 text-gray-600" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-lg font-bold text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    {/* Progress bar placeholder - can be connected to real data later */}
                                    <div className="w-full bg-gray-700/50 h-1.5 rounded-full mt-2 overflow-hidden backdrop-blur-sm">
                                        <div className="bg-primary h-full rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <div className="mt-12 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-sm text-gray-400">
                {/* Tip moved to Admin */}
            </div>
        </div>
    );
};

export default Home;
