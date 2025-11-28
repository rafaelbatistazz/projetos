import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Loader2, PlayCircle } from 'lucide-react';

type Course = Database['public']['Tables']['courses']['Row'];

const MemberHome = () => {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-white mb-8">Meus Cursos</h1>

            {courses.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                    <p>Nenhum curso disponível no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="group cursor-pointer flex flex-col"
                        >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                        <PlayCircle className="h-12 w-12 text-gray-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                                {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                {course.description}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberHome;
