import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Loader2, ChevronLeft, Play, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Curso não encontrado.</p>
                <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
                    Voltar para Home
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Voltar para o Portal
            </button>

            <div className="mb-12">
                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                <p className="text-gray-400 max-w-2xl">{course.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <div
                        key={module.id}
                        className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 group"
                    >
                        <div className="aspect-[3/4] relative bg-gray-900">
                            {module.thumbnail_url ? (
                                <img
                                    src={module.thumbnail_url}
                                    alt={module.title}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center border-b border-gray-800">
                                    <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                                    <div className="w-12 h-1 bg-blue-500 rounded-full mb-4" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e] via-transparent to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{module.title}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{module.description}</p>

                                {module.lessons.length > 0 ? (
                                    <Button
                                        className="w-full justify-center"
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
                ))}
            </div>
        </div>
    );
};

export default CourseModules;
