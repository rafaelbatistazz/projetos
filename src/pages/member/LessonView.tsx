import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import VideoPlayer from '../../components/VideoPlayer';
import Button from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, PlayCircle, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

const LessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);

    useEffect(() => {
        if (lessonId) {
            fetchLessonAndContext(lessonId);
        }
    }, [lessonId]);

    const fetchLessonAndContext = async (id: string) => {
        setLoading(true);
        try {
            // Fetch current lesson
            const { data: lessonData, error: lessonError } = await supabase
                .from('lessons')
                .select('*, modules(*, courses(*))')
                .eq('id', id)
                .single();

            if (lessonError) throw lessonError;
            setLesson(lessonData);

            // Fetch all modules and lessons for the course
            // @ts-ignore
            const courseId = lessonData.modules?.course_id;

            if (courseId) {
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select('*')
                    .eq('course_id', courseId)
                    .order('order_position');

                if (modulesError) throw modulesError;

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
                calculateNavigation(id, modulesWithLessons);
            }
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateNavigation = (currentId: string, modulesData: ModuleWithLessons[]) => {
        const allLessons: Lesson[] = [];
        modulesData.forEach(module => {
            module.lessons.forEach(l => allLessons.push(l));
        });

        const currentIndex = allLessons.findIndex(l => l.id === currentId);

        if (currentIndex !== -1) {
            setPrevLessonId(currentIndex > 0 ? allLessons[currentIndex - 1].id : null);
            setNextLessonId(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null);
        }
    };

    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (userEmail && modules.length > 0) {
            fetchCompletedLessons();
        }
    }, [userEmail, modules]);

    const fetchCompletedLessons = async () => {
        if (!userEmail) return;
        const { data } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('email', userEmail);

        if (data) {
            setCompletedLessons(new Set(data.map(p => p.lesson_id)));
        }
    };

    // Update handleLessonComplete to update local state
    const handleLessonComplete = async () => {
        if (!userEmail || !lesson) return;

        if (isCompleted) {
            const { error } = await supabase
                .from('user_progress')
                .delete()
                .eq('email', userEmail)
                .eq('lesson_id', lesson.id);

            if (!error) {
                setIsCompleted(false);
                setCompletedLessons(prev => {
                    const next = new Set(prev);
                    next.delete(lesson.id);
                    return next;
                });
            }
        } else {
            const { error } = await supabase
                .from('user_progress')
                .insert({
                    email: userEmail,
                    lesson_id: lesson.id
                });

            if (!error) {
                setIsCompleted(true);
                setCompletedLessons(prev => new Set(prev).add(lesson.id));
                if (nextLessonId) {
                    navigate(`/lesson/${nextLessonId}`);
                }
            }
        }
    };

    // ... (render part)

    {/* Sidebar Playlist */ }
    <div className={cn(
        "w-80 bg-[#1a1f2e] border-l border-gray-800 flex flex-col transition-all duration-300 absolute md:relative right-0 h-full z-40",
        sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0 md:border-none"
    )}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Conteúdo do Curso</h2>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                <X className="h-5 w-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {modules.map((module) => (
                <div key={module.id} className="border-b border-gray-800/50">
                    <div className="px-4 py-3 bg-[#151a25]">
                        <h3 className="text-sm font-medium text-gray-300">{module.title}</h3>
                    </div>
                    <div>
                        {module.lessons.map((l) => {
                            const isLessonCompleted = completedLessons.has(l.id);
                            const isCurrent = l.id === lesson?.id;

                            return (
                                <button
                                    key={l.id}
                                    onClick={() => navigate(`/lesson/${l.id}`)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-800/50 transition-colors",
                                        isCurrent ? "bg-primary/10 border-l-2 border-primary" : ""
                                    )}
                                >
                                    {isLessonCompleted ? (
                                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                                    ) : (
                                        <PlayCircle className={cn(
                                            "h-4 w-4 mt-0.5 flex-shrink-0",
                                            isCurrent ? "text-primary" : "text-gray-500"
                                        )} />
                                    )}
                                    <div>
                                        <p className={cn(
                                            "text-sm font-medium line-clamp-2",
                                            isCurrent ? "text-primary" : "text-gray-400",
                                            isLessonCompleted && !isCurrent && "text-gray-500"
                                        )}>
                                            {l.title}
                                        </p>
                                        <span className="text-xs text-gray-600 mt-1 block">
                                            {l.duration || '00:00'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>

    {/* Toggle Sidebar Button (Mobile/Desktop) */ }
    <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 right-4 z-50 p-2 bg-gray-800 rounded-lg text-white shadow-lg hover:bg-gray-700 md:hidden"
    >
        <Menu className="h-5 w-5" />
    </button>
        </div >
    );
};

export default LessonView;
