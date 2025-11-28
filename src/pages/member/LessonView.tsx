import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    const handleLessonComplete = () => {
        // Here you would implement logic to mark lesson as complete in DB
        if (nextLessonId) {
            navigate(`/lesson/${nextLessonId}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0f1419]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!lesson) return <div>Aula não encontrada.</div>;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0f1419]">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-6 max-w-6xl mx-auto w-full">
                    <div className="flex items-center mb-4 text-gray-400 text-sm">
                        <button onClick={() => navigate(-1)} className="hover:text-white flex items-center">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Voltar
                        </button>
                        <span className="mx-2">/</span>
                        <span className="truncate">{lesson.title}</span>
                    </div>

                    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border border-gray-800">
                        <VideoPlayer
                            videoId={lesson.youtube_video_id}
                            onEnd={handleLessonComplete}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
                            {/* @ts-ignore */}
                            <p className="text-gray-400">{lesson.modules?.title}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                disabled={!prevLessonId}
                                onClick={() => prevLessonId && navigate(`/lesson/${prevLessonId}`)}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anterior
                            </Button>
                            <Button
                                onClick={handleLessonComplete}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Concluir Aula
                            </Button>
                            <Button
                                variant="secondary"
                                disabled={!nextLessonId}
                                onClick={() => nextLessonId && navigate(`/lesson/${nextLessonId}`)}
                            >
                                Próxima
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {lesson.support_text && (
                        <div className="bg-[#1a1f2e] p-6 rounded-xl border border-gray-800">
                            <h3 className="text-lg font-semibold text-white mb-4">Material de Apoio</h3>
                            <div className="prose prose-invert max-w-none text-gray-300">
                                <p className="whitespace-pre-wrap">{lesson.support_text}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Playlist */}
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
                                {module.lessons.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => navigate(`/lesson/${l.id}`)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-800/50 transition-colors",
                                            l.id === lesson.id ? "bg-blue-900/20 border-l-2 border-blue-500" : ""
                                        )}
                                    >
                                        <PlayCircle className={cn(
                                            "h-4 w-4 mt-0.5 flex-shrink-0",
                                            l.id === lesson.id ? "text-blue-500" : "text-gray-500"
                                        )} />
                                        <div>
                                            <p className={cn(
                                                "text-sm font-medium line-clamp-2",
                                                l.id === lesson.id ? "text-blue-400" : "text-gray-400"
                                            )}>
                                                {l.title}
                                            </p>
                                            <span className="text-xs text-gray-600 mt-1 block">
                                                {l.duration || '00:00'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Toggle Sidebar Button (Mobile/Desktop) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-4 right-4 z-50 p-2 bg-gray-800 rounded-lg text-white shadow-lg hover:bg-gray-700 md:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>
        </div>
    );
};

export default LessonView;
