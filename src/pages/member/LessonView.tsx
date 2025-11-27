import { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import VideoPlayer from '../../components/VideoPlayer';
import Button from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];

interface CourseStructure extends Course {
    modules: (Module & {
        lessons: Lesson[];
    })[];
}

const LessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { courses } = useOutletContext<{ courses: CourseStructure[] }>();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);

    useEffect(() => {
        if (lessonId) {
            fetchLesson(lessonId);
        }
    }, [lessonId]);

    useEffect(() => {
        if (lesson && courses.length > 0) {
            calculateNavigation();
        }
    }, [lesson, courses]);

    const fetchLesson = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setLesson(data);
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateNavigation = () => {
        if (!lesson) return;

        // Flatten all lessons to find current index
        const allLessons: Lesson[] = [];
        courses.forEach(course => {
            course.modules.forEach(module => {
                module.lessons.forEach(l => {
                    allLessons.push(l);
                });
            });
        });

        const currentIndex = allLessons.findIndex(l => l.id === lesson.id);

        if (currentIndex !== -1) {
            if (currentIndex > 0) {
                setPrevLessonId(allLessons[currentIndex - 1].id);
            } else {
                setPrevLessonId(null);
            }

            if (currentIndex < allLessons.length - 1) {
                setNextLessonId(allLessons[currentIndex + 1].id);
            } else {
                setNextLessonId(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lesson) {
        return <div>Aula não encontrada.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
                <VideoPlayer videoId={lesson.youtube_video_id} />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                    <div className="flex space-x-2">
                        <Button
                            variant="secondary"
                            disabled={!prevLessonId}
                            onClick={() => prevLessonId && navigate(`/lesson/${prevLessonId}`)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Anterior
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!nextLessonId}
                            onClick={() => nextLessonId && navigate(`/lesson/${nextLessonId}`)}
                        >
                            Próxima
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {lesson.support_text && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 prose max-w-none">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Material de Apoio</h3>
                        <p className="text-gray-600 whitespace-pre-wrap">{lesson.support_text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonView;
