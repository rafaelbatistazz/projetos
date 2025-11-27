import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import {
    LogOut,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface CourseStructure extends Course {
    modules: (Module & {
        lessons: Lesson[];
    })[];
}

const MemberLayout = () => {
    const { logout, userEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [courses, setCourses] = useState<CourseStructure[]>([]);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .order('order_position');

            if (coursesError) throw coursesError;

            const structure: CourseStructure[] = [];

            for (const course of coursesData || []) {
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select('*')
                    .eq('course_id', course.id)
                    .order('order_position');

                if (modulesError) throw modulesError;

                const modulesWithLessons = [];
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

                structure.push({
                    ...course,
                    modules: modulesWithLessons,
                });
            }

            setCourses(structure);

            if (structure.length > 0) {
                setExpandedCourses({ [structure[0].id]: true });
                if (structure[0].modules.length > 0) {
                    setExpandedModules({ [structure[0].modules[0].id]: true });
                }
            }

        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#1e293b]">
            {/* Sidebar */}
            <aside className={cn(
                "w-80 bg-[#0f172a] border-r border-gray-800 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:transform-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
                    <img
                        src="https://lhbwfbquxkutcyqazpnw.supabase.co/storage/v1/object/public/images/logo/v3%20png.webp"
                        alt="Advanx Academy"
                        className="h-8 w-auto"
                    />
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Course List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {courses.map(course => (
                        <div key={course.id} className="space-y-1">
                            <button
                                onClick={() => toggleCourse(course.id)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <span className="truncate">{course.title}</span>
                                {expandedCourses[course.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>

                            {expandedCourses[course.id] && (
                                <div className="pl-2 space-y-1">
                                    {course.modules.map(module => (
                                        <div key={module.id} className="space-y-1">
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
                                            >
                                                <span className="truncate font-medium">{module.title}</span>
                                                {expandedModules[module.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            </button>

                                            {expandedModules[module.id] && (
                                                <div className="pl-4 space-y-1">
                                                    {module.lessons.map(lesson => {
                                                        const isActive = location.pathname === `/lesson/${lesson.id}`;
                                                        return (
                                                            <Link
                                                                key={lesson.id}
                                                                to={`/lesson/${lesson.id}`}
                                                                onClick={() => setIsSidebarOpen(false)}
                                                                className={cn(
                                                                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                                    isActive
                                                                        ? "bg-blue-600 text-white"
                                                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                                                )}
                                                            >
                                                                <PlayCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                                                                <span className="truncate">{lesson.title}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* User info + Logout */}
                <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-sm text-gray-400 truncate max-w-[200px]">{userEmail}</span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Sair"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-[#0f172a] border-b border-gray-800 flex items-center px-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <img
                        src="https://lhbwfbquxkutcyqazpnw.supabase.co/storage/v1/object/public/images/logo/v3%20png.webp"
                        alt="Advanx Academy"
                        className="h-6 w-auto ml-4"
                    />
                </header>

                <main className="flex-1 overflow-y-auto bg-[#1e293b]">
                    <Outlet context={{ courses }} />
                </main>
            </div>
        </div>
    );
};

export default MemberLayout;
