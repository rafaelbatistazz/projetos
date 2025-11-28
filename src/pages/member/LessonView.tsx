import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import VideoPlayer from '../../components/VideoPlayer';
import Button from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, PlayCircle, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

const LessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { userEmail } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    // Initialize sidebar based on screen width to avoid flash/black screen issues
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (lessonId) {
            fetchLessonAndContext(lessonId);
        }
    }, [lessonId]);

    useEffect(() => {
        if (userEmail && modules.length > 0) {
            fetchCompletedLessons();
        }
    }, [userEmail, modules]);

    useEffect(() => {
        if (lesson && completedLessons.has(lesson.id)) {
            setIsCompleted(true);
        } else {
            setIsCompleted(false);
        }
    }, [lesson, completedLessons]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchLessonAndContext = async (id: string) => {
        setLoading(true);
        try {
            const { data: lessonData, error: lessonError } = await supabase
                .from('lessons')
                .select('*, modules(*, courses(*))')
                .eq('id', id)
                .single();

            if (lessonError) throw lessonError;
            setLesson(lessonData);

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

                // Auto-advance to next lesson
                if (nextLessonId) {
                    toast.success('Aula concluída! Indo para a próxima...');
                    setTimeout(() => navigate(`/lesson/${nextLessonId}`), 1000);
                } else {
                    toast.success('Aula concluída!');
                }
            }
        }
    };

    // Helper to render text with clickable links
    const renderSupportText = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <div
            className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden select-none relative"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div>
                        {lesson.youtube_video_id && (
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 mb-6">
                                <VideoPlayer videoId={lesson.youtube_video_id} />
                            </div>
                        )}

                        {/* Action Buttons - Responsive Layout */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    variant="secondary"
                                    onClick={() => prevLessonId && navigate(`/lesson/${prevLessonId}`)}
                                    disabled={!prevLessonId}
                                    className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 justify-center"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => nextLessonId && navigate(`/lesson/${nextLessonId}`)}
                                    disabled={!nextLessonId}
                                    className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 justify-center"
                                >
                                    Próxima
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>

                            <Button
                                onClick={handleLessonComplete}
                                className={cn(
                                    "w-full sm:w-auto px-8 py-3 text-base font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-primary/25",
                                    isCompleted
                                        ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-500/50"
                                        : "bg-primary hover:bg-primary/90 ring-2 ring-primary/50"
                                )}
                            >
                                {isCompleted ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Concluída
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Concluir Aula
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="mt-8 mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{lesson.title}</h1>
                            <p className="text-gray-400 text-lg">
                                {(lesson as any).modules?.title}
                            </p>
                        </div>

                        {lesson.support_text && (
                            <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="bg-primary/10 p-2 rounded-lg text-primary">📚</span>
                                    Material de Apoio
                                </h3>
                                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {renderSupportText(lesson.support_text)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Playlist */}
            <div className={cn(
                "w-80 bg-card border-l border-border flex flex-col transition-all duration-300 absolute md:relative right-0 h-full z-40 shadow-2xl md:shadow-none",
                sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0 md:border-none"
            )}>
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                    <h2 className="font-semibold text-white">Conteúdo do Curso</h2>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {modules.map((module) => (
                        <div key={module.id} className="border-b border-border">
                            <div className="px-4 py-3 bg-muted/30">
                                <h3 className="text-sm font-medium text-gray-300">{module.title}</h3>
                            </div>
                            <div>
                                {module.lessons.map((l) => {
                                    const isLessonCompleted = completedLessons.has(l.id);
                                    const isCurrent = l.id === lesson?.id;

                                    return (
                                        <button
                                            key={l.id}
                                            onClick={() => {
                                                navigate(`/lesson/${l.id}`);
                                                if (window.innerWidth < 768) setSidebarOpen(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
                                                isCurrent
                                                    ? "bg-primary/10 border-l-2 border-primary"
                                                    : "hover:bg-accent/50 border-l-2 border-transparent"
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

            {/* Toggle Sidebar Button (Mobile) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                    "absolute top-4 right-4 z-50 p-2 bg-card rounded-lg text-white shadow-lg hover:bg-gray-800 md:hidden border border-border transition-opacity duration-300",
                    sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                <Menu className="h-5 w-5" />
            </button>
        </div>
    );
};

export default LessonView;
