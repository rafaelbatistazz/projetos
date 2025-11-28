import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Loader2, ChevronLeft, Play, Lock, ArrowLeft, PlayCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
    thumbnail_url?: string | null;
}

const CourseModules = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            fetchCourseContent(courseId);
        }
    }, [courseId]);

    const fetchCourseContent = async (id: string) => {
        try {
            // Fetch course details
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', id)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            // Fetch modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('*')
                .eq('course_id', id)
                .order('order_position');

            if (modulesError) throw modulesError;

            // Fetch lessons for each module
            const modulesWithLessons: ModuleWithLessons[] = [];
            for (const module of modulesData || []) {
                const { data: lessonsData, error: lessonsError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('module_id', module.id)
                    .order('order_position');

                if (lessonsError) throw lessonsError;

                modulesWithLessons.push({
                    ...module,
                    lessons: lessonsData || [],
                });
            }

            setModules(modulesWithLessons);
        } catch (error) {
            console.error('Error fetching course content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayModule = (moduleId: string) => {
        // Find the module and its first lesson
        const module = modules.find(m => m.id === moduleId);
        if (module && module.lessons.length > 0) {
            navigate(`/lesson/${module.lessons[0].id}`);
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
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <button
                    onClick={() => navigate('/member')}
                    className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Cursos
                </button>
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                <p className="mt-2 text-gray-400">{course.description}</p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
            >
                {modules.map((module, index) => (
                    <motion.div
                        key={module.id}
                        variants={item}
                        className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden hover:border-primary/50 transition-all duration-300"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-sm text-gray-400 border border-gray-700">
                                            {index + 1}
                                        </span>
                                        {module.title}
                                    </h3>
                                    <p className="text-gray-400 ml-11">{module.description}</p>
                                </div>
                                onClick={() => navigate(`/lesson/${module.lessons[0].id}`)}
                                    >
                                <Play className="h-4 w-4 mr-2" />
                                Acessar Módulo
                            </Button>
                            ) : (
                            <Button
                                variant="secondary"
                                className="w-full justify-center opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Em Breve
                            </Button>
                                )}
                        </div>
                    </div>
                    </div>
    ))
}
            </div >
        </div >
    );
};

export default CourseModules;
